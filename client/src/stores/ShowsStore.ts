import { action, makeObservable, observable, runInAction } from "mobx";
import { BaseAPIStore } from "./BaseAPIStore";
import { Show } from "./types";

export class ShowsStore {
  shows: Show[] = [];
  currentShow: Show | null = null;
  loading: boolean = false;
  error: string | null = null;
  private baseAPI: BaseAPIStore;

  constructor(baseAPI: BaseAPIStore) {
    // Explicitly initialize the shows array first
    this.shows = [];
    this.currentShow = null;
    this.loading = false;
    this.error = null;
    this.baseAPI = baseAPI;

    // Then make observable with explicit configuration
    makeObservable(this, {
      shows: observable,
      currentShow: observable,
      loading: observable,
      error: observable,
      fetchShows: action,
      createShow: action,
      joinShow: action,
      fetchShow: action,
      updateCurrentPerformer: action,
      updateCurrentPerformerAPI: action,
      fetchShowRatings: action,
      clearCurrentShow: action,
      addToQueue: action,
      reorderQueue: action,
      nextPerformance: action,
      removeQueueBySinger: action, // <-- Add action for removing queue by singer
      removeQueueItem: action, // <-- Add action for removing a specific queue item
      deleteShow: action, // <-- Add action for deleting a show
    });
  }

  // Normalize server responses to ensure arrays are always defined
  private normalizeShow = (show: any): Show => {
    return {
      id: show.id,
      name: show.name ?? "",
      venue: show.venue ?? "karafun",
      currentSinger: show.currentSinger ?? undefined,
      currentSong: show.currentSong ?? undefined,
      participants: Array.isArray(show.participants) ? show.participants : [],
      ratings: Array.isArray(show.ratings) ? show.ratings : [],
      createdAt: show.createdAt ? new Date(show.createdAt) : new Date(),
      // ensure queue is always present
      queue: Array.isArray(show.queue) ? show.queue : [],
    } as Show;
  };

  async fetchShows() {
    this.loading = true;
    this.error = null;

    try {
      const shows = await this.baseAPI.get<Show[]>("/api/shows");

      runInAction(() => {
        const list = Array.isArray(shows)
          ? shows.map((s: any) => this.normalizeShow(s))
          : [];
        this.shows = list;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
        this.loading = false;
      });
    }
  }

  async createShow(name: string, venue: "karafun" | "excess" | "dj steve") {
    this.loading = true;
    this.error = null;

    try {
      const newShow = await this.baseAPI.post<Show>("/api/shows", {
        name,
        venue,
      });

      const normalized = this.normalizeShow(newShow as any);
      runInAction(() => {
        this.shows.push(normalized);
        this.loading = false;
      });

      return normalized;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
        this.loading = false;
      });
      throw error;
    }
  }

  async joinShow(showId: string, username: string) {
    try {
      // Fetch user from localStorage (set by AuthStore)
      const userJson = localStorage.getItem("user_data");
      const user = userJson ? JSON.parse(userJson) : null;
      const userId = user?.id;

      const payload = userId ? { showId, userId } : { showId, username };

      const updatedShow = await this.baseAPI.post<Show>(
        "/api/shows/join",
        payload
      );

      const normalized = this.normalizeShow(updatedShow as any);
      runInAction(() => {
        const index = this.shows.findIndex((s) => s.id === showId);
        if (index !== -1) {
          this.shows[index] = normalized;
        } else {
          this.shows.push(normalized);
        }
        this.currentShow = normalized;
      });

      return normalized;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    }
  }

  async fetchShow(id: string) {
    this.loading = true;
    this.error = null;

    try {
      const show = await this.baseAPI.get<Show>(`/api/shows/${id}`);

      const normalized = this.normalizeShow(show as any);
      runInAction(() => {
        this.currentShow = normalized;
        this.loading = false;
      });

      return normalized;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
        this.loading = false;
      });
      throw error;
    }
  }

  async ratePerformance(
    showId: string,
    singer: string,
    song: string,
    rating: number,
    comment: string,
    ratedBy: string
  ) {
    try {
      const newRating = await this.baseAPI.post("/api/shows/rate", {
        showId,
        singer,
        song,
        rating,
        comment,
        ratedBy,
      });

      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          if (!Array.isArray(this.currentShow.ratings)) {
            this.currentShow.ratings = [] as any;
          }
          this.currentShow.ratings.push(newRating as any);
        }
      });

      return newRating;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    }
  }

  updateCurrentPerformer(singer: string, song: string) {
    if (this.currentShow) {
      this.currentShow.currentSinger = singer;
      this.currentShow.currentSong = song;
    }
  }

  async updateCurrentPerformerAPI(
    showId: string,
    singer: string,
    song: string
  ) {
    try {
      const updatedShow = await this.baseAPI.patch<Show>(
        `/api/shows/${showId}/current-performer`,
        {
          singer,
          song,
        }
      );

      const normalized = this.normalizeShow(updatedShow as any);
      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          this.currentShow.currentSinger = singer;
          this.currentShow.currentSong = song;
        }
        // Update in shows list as well
        const index = this.shows.findIndex((s) => s.id === showId);
        if (index !== -1) {
          this.shows[index] = normalized;
        } else {
          this.shows.push(normalized);
        }
      });

      return normalized;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    }
  }

  async fetchShowRatings(showId: string) {
    try {
      const ratings = await this.baseAPI.get(`/api/shows/${showId}/ratings`);
      return ratings;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    }
  }

  async addToQueue(showId: string, singer: string, song: string) {
    try {
      const updated = await this.baseAPI.post<Show>(
        `/api/shows/${showId}/queue`,
        {
          singer,
          song,
        }
      );
      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          this.currentShow.queue = updated.queue || ([] as any);
        }
        const index = this.shows.findIndex((s) => s.id === showId);
        if (index !== -1) this.shows[index] = updated;
      });
      return updated;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    }
  }

  async reorderQueue(showId: string, newQueue: { singer: string; song: string }[]) {
    try {
      const updated = await this.baseAPI.patch<Show>(
        `/api/shows/${showId}/queue/reorder`,
        { queue: newQueue }
      );
      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          this.currentShow.queue = updated.queue || ([] as any);
        }
        const index = this.shows.findIndex((s) => s.id === showId);
        if (index !== -1) this.shows[index] = updated;
      });
      return updated;
    } catch (error) {
      // Fallback: update locally even if server fails
      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          this.currentShow.queue = newQueue as any;
        }
      });
      console.error("Failed to reorder queue on server:", error);
      return this.currentShow;
    }
  }

  async nextPerformance(showId: string) {
    try {
      const updated = await this.baseAPI.post<Show>(
        `/api/shows/${showId}/next`,
        {}
      );
      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          this.currentShow.currentSinger = updated.currentSinger;
          this.currentShow.currentSong = updated.currentSong;
          this.currentShow.queue = updated.queue || ([] as any);
        }
        const index = this.shows.findIndex((s) => s.id === showId);
        if (index !== -1) this.shows[index] = updated;
      });
      return updated;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    }
  }

  async removeQueueBySinger(showId: string, singer: string) {
    try {
      // Attempt server-side removal if supported
      const updated = await this.baseAPI.delete<Show>(
        `/api/shows/${showId}/queue/by-singer`,
        { data: { singer } }
      );
      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          this.currentShow.queue = updated.queue || ([] as any);
        }
        const index = this.shows.findIndex((s) => s.id === showId);
        if (index !== -1) this.shows[index] = updated;
      });
      return updated;
    } catch (error) {
      // Fallback: filter locally so the UI updates immediately
      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          this.currentShow.queue = (this.currentShow.queue || []).filter(
            (q) => q.singer !== singer
          ) as any;
        }
      });
      return this.currentShow;
    }
  }

  async removeQueueItem(showId: string, index: number) {
    try {
      const updated = await this.baseAPI.delete<Show>(
        `/api/shows/${showId}/queue/item`,
        { data: { index } }
      );
      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          this.currentShow.queue = updated.queue || ([] as any);
        }
        const i = this.shows.findIndex((s) => s.id === showId);
        if (i !== -1) this.shows[i] = updated;
      });
      return updated;
    } catch (error) {
      // Fallback: remove locally by index
      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          const q = (this.currentShow.queue || ([] as any)).slice();
          if (index >= 0 && index < q.length) {
            q.splice(index, 1);
          }
          (this.currentShow as any).queue = q as any;
        }
      });
      return this.currentShow;
    }
  }

  async deleteShow(
    showId: string
  ): Promise<{ success: boolean; message: string }> {
    this.loading = true;
    this.error = null;

    try {
      const result = await this.baseAPI.delete<{
        success: boolean;
        message: string;
      }>(`/api/shows/admin/${showId}`);

      if (result.success) {
        runInAction(() => {
          // Remove the show from the local shows array
          this.shows = this.shows.filter((show) => show.id !== showId);

          // Clear current show if it's the one being deleted
          if (this.currentShow && this.currentShow.id === showId) {
            this.currentShow = null;
          }

          this.loading = false;
        });
      } else {
        runInAction(() => {
          this.error = result.message || "Failed to delete show";
          this.loading = false;
        });
      }

      return result;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to delete show";
        this.loading = false;
      });
      throw error;
    }
  }

  async hasUserRatedCurrentPerformance(
    showId: string,
    username: string
  ): Promise<{ hasRated: boolean; performer?: string; song?: string }> {
    try {
      const response = await this.baseAPI.get<{
        hasRated: boolean;
        performer?: string;
        song?: string;
      }>(`/api/shows/${showId}/has-rated/${encodeURIComponent(username)}`);
      return response;
    } catch (error) {
      console.error("Error checking if user has rated:", error);
      return { hasRated: false };
    }
  }

  async getUserHistory(username: string): Promise<any[]> {
    try {
      const response = await this.baseAPI.get<{
        success: boolean;
        history: {
          ratingsGiven: any[];
          ratingsReceived: any[];
          showsAttended: any[];
          stats: any;
        };
      }>(`/api/users/${encodeURIComponent(username)}/history`);

      if (!response?.success || !response.history) {
        return [];
      }

      // Transform the API response to match the frontend's expected format
      const { ratingsGiven = [], ratingsReceived = [] } = response.history;

      // Combine ratings given and received into a single array with normalized structure
      const combinedHistory: any[] = [];

      // Add ratings given by this user
      ratingsGiven.forEach((rating: any) => {
        combinedHistory.push({
          id: rating.id,
          rating: parseFloat(rating.score),
          comment: rating.comment || "",
          createdAt: rating.createdAt,
          singer: rating.performer?.username || "Unknown",
          song: rating.songTitle || "Unknown Song",
          showName: rating.show?.name || "Unknown Show",
          ratedBy: username, // This user gave this rating
        });
      });

      // Add ratings received by this user
      ratingsReceived.forEach((rating: any) => {
        combinedHistory.push({
          id: rating.id + 100000, // Offset to avoid ID conflicts
          rating: parseFloat(rating.score),
          comment: rating.comment || "",
          createdAt: rating.createdAt,
          singer: username, // This user received this rating
          song: rating.songTitle || "Unknown Song",
          showName: rating.show?.name || "Unknown Show",
          ratedBy: rating.rater?.username || "Unknown",
        });
      });

      console.log(
        `Fetched and transformed history for ${username}:`,
        combinedHistory
      );
      return combinedHistory;
    } catch (error) {
      console.error("Error fetching user history:", error);
      return [];
    }
  }

  clearCurrentShow() {
    this.currentShow = null;
  }
}
