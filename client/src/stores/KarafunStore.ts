import { makeAutoObservable, runInAction } from "mobx";
import { io, Socket } from "socket.io-client";
import {
  KarafunQueueData,
  KarafunSinger,
  KarafunSongEntry,
} from "../services/karafunService";
import { BaseAPIStore } from "./BaseAPIStore";

export class KarafunStore {
  singers: KarafunSinger[] = [];
  songEntries: KarafunSongEntry[] = [];
  loading: boolean = false;
  error: string | null = null;
  lastUpdated: Date | null = null;
  currentSessionId: string | null = null;
  currentShowId: string | null = null;
  currentUrl: string | null = null;
  // Page state management
  pageState:
    | "loading"
    | "empty"
    | "populated"
    | "error"
    | "nickname-required"
    | null = null;
  stateMessage: string | null = null;
  hasCurrentPerformer: boolean = false;
  isAutoPolling: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  private baseAPI: BaseAPIStore;
  private socket: Socket | null = null;

  constructor(baseAPI: BaseAPIStore) {
    makeAutoObservable(this);
    this.baseAPI = baseAPI;
    this.initializeSocket();
  }

  private initializeSocket(): void {
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    this.socket = io(socketUrl);

    this.socket.on(
      "karafunQueueUpdated",
      (data: { showId: number; karafunData: KarafunQueueData }) => {
        if (
          this.currentShowId &&
          parseInt(this.currentShowId) === data.showId
        ) {
          console.log("🔄 Received Karafun queue update via socket");
          this.updateQueueData(data.karafunData);
        }
      }
    );
  }

  private updateQueueData(data: KarafunQueueData): void {
    runInAction(() => {
      this.singers = data.singers;
      this.songEntries = data.songEntries || [];
      this.currentSessionId = data.sessionId;
      this.lastUpdated = new Date(data.lastUpdated);
      this.pageState = data.pageState;
      this.stateMessage = data.stateMessage || null;
      this.hasCurrentPerformer = data.hasCurrentPerformer;

      // Clear error if we got valid data
      if (data.pageState !== "error") {
        this.error = null;
      }
    });
  }

  // Load cached data when joining a show
  async loadCachedData(showId: string): Promise<void> {
    try {
      const show = await this.baseAPI.get(`/api/shows/${showId}`);

      if (show.venue === "karafun" && show.karafunCachedData) {
        console.log("📦 Loading cached Karafun data from server");
        this.currentShowId = showId;
        this.updateQueueData(show.karafunCachedData);

        // Start polling if we have active data
        if (show.karafunCachedData.singers?.length > 0) {
          this.startPolling();
        }
      }
    } catch (error) {
      console.error("❌ Failed to load cached Karafun data:", error);
    }
  }

  async parseQueue(url: string, showId: string): Promise<void> {
    runInAction(() => {
      this.loading = true;
      this.error = null;
    });

    try {
      console.log("KarafunStore: Parsing queue for URL:", url);

      // Update the Karafun URL for this show first
      await this.baseAPI.patch(`/api/shows/${showId}/karafun-url`, {
        karafunUrl: url,
      });
      this.currentShowId = showId;

      // Get the queue data using the Shows API
      const data: KarafunQueueData = await this.baseAPI.get<KarafunQueueData>(
        `/api/shows/${showId}/karafun-queue`
      );

      console.log("KarafunStore: Received data:", data);

      // Update the queue data using the helper method
      this.updateQueueData(data);

      runInAction(() => {
        this.currentUrl = url;
        this.loading = false;

        // Handle special states
        if (data.pageState === "nickname-required") {
          this.error =
            "Session required nickname entry, but automatic joining may have failed.";
        } else if (data.pageState === "error") {
          this.error = data.stateMessage || "Failed to parse queue";
        } else if (data.pageState === "empty") {
          // Clear error for empty state - this is normal
          this.error = null;
        }
      });

      console.log(
        `KarafunStore: Successfully parsed ${data.singers.length} singers`
      );

      // Auto-set current performer if someone is in position #1 AND they are a registered user
      if (data.songEntries && data.songEntries.length > 0) {
        const firstInQueue = data.songEntries[0];
        if (firstInQueue && firstInQueue.singer) {
          // Get the show data to check if the performer is a registered user
          try {
            const show = await this.baseAPI.get(`/api/shows/${showId}`);
            const registeredUsers = Array.isArray(show.participants)
              ? show.participants
              : [];

            if (registeredUsers.includes(firstInQueue.singer)) {
              console.log(
                `KarafunStore: Setting current performer: ${firstInQueue.singer} - ${firstInQueue.song} (validated registered user)`
              );
              // Call the backend to set the current performer
              await this.baseAPI.patch(
                `/api/shows/${showId}/current-performer`,
                {
                  singer: firstInQueue.singer,
                  song: firstInQueue.song,
                }
              );
            } else {
              console.log(
                `KarafunStore: Skipping current performer "${firstInQueue.singer}" - not a registered user`
              );
            }
          } catch (error) {
            console.error(
              "KarafunStore: Failed to set current performer:",
              error
            );
          }
        }
      }

      // Start auto-polling for active Karafun shows
      if (data.singers.length > 0 && !this.isAutoPolling) {
        this.startPolling();
      }
    } catch (error) {
      console.error("KarafunStore: Parse error:", error);
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to parse queue";
        this.loading = false;
      });
    }
  }

  async refreshQueue(): Promise<void> {
    if (this.currentUrl && this.currentShowId) {
      await this.parseQueue(this.currentUrl, this.currentShowId);
    } else {
      console.warn(
        "KarafunStore: Cannot refresh queue - missing URL or show ID"
      );
    }
  }

  /**
   * Force refresh the Karafun queue, bypassing cache
   * This will broadcast the updated data to all clients
   */
  async forceRefreshQueue(): Promise<void> {
    if (!this.currentShowId) {
      console.warn("KarafunStore: Cannot force refresh - missing show ID");
      return;
    }

    runInAction(() => {
      this.loading = true;
      this.error = null;
    });

    try {
      console.log(
        "KarafunStore: Force refreshing queue for show:",
        this.currentShowId
      );

      const data: KarafunQueueData = await this.baseAPI.post<KarafunQueueData>(
        `/api/shows/${this.currentShowId}/karafun-queue/refresh`,
        {}
      );

      console.log("KarafunStore: Received force-refreshed data:", data);
      this.updateQueueData(data);

      runInAction(() => {
        this.loading = false;
        if (data.pageState === "error") {
          this.error = data.stateMessage || "Failed to refresh queue";
        }
      });
    } catch (error) {
      console.error("KarafunStore: Force refresh error:", error);
      runInAction(() => {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to force refresh queue";
        this.loading = false;
      });
    }
  }

  clearQueue(): void {
    runInAction(() => {
      this.singers = [];
      this.songEntries = [];
      this.currentSessionId = null;
      this.currentUrl = null;
      this.currentShowId = null;
      this.lastUpdated = null;
      this.error = null;
      this.pageState = null;
      this.stateMessage = null;
      this.hasCurrentPerformer = false;
    });
    this.stopPolling();
  }

  // Auto-polling for Karafun shows
  startPolling(): void {
    if (this.isAutoPolling || !this.currentUrl || !this.currentShowId) {
      return;
    }

    runInAction(() => {
      this.isAutoPolling = true;
    });

    // Poll every minute (60 seconds)
    this.pollingInterval = setInterval(async () => {
      try {
        await this.refreshQueue();
      } catch (error) {
        console.error("KarafunStore: Polling error:", error);
      }
    }, 60000);

    console.log("KarafunStore: Started auto-polling every 60 seconds");
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    runInAction(() => {
      this.isAutoPolling = false;
    });
    console.log("KarafunStore: Stopped auto-polling");
  }

  get totalSingers(): number {
    return this.singers.length;
  }

  get totalSongs(): number {
    return this.songEntries.length;
  }

  get uniqueSingerNames(): string[] {
    return [...new Set(this.songEntries.map((entry) => entry.singer))];
  }

  get isActive(): boolean {
    return this.singers.length > 0 && this.currentSessionId !== null;
  }

  extractSessionId(url: string): string | null {
    // Simple extraction logic - can be enhanced later
    const match = url.match(/karafun\.com\/([^\/]+)/);
    return match ? match[1] : null;
  }
}
