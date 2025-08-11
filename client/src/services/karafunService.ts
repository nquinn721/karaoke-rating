import { BaseAPIStore } from "../stores/BaseAPIStore";

export interface KarafunSinger {
  nickname: string;
  position?: number;
  joinedAt?: Date;
  currentSong?: string;
  totalSongs?: number;
}

export interface KarafunSongEntry {
  song: string;
  singer: string;
  position: number;
  isCurrent?: boolean;
}

export interface KarafunQueueData {
  sessionId: string;
  singers: KarafunSinger[];
  totalSingers: number;
  lastUpdated: Date;
  // New fields for enhanced data
  songEntries: KarafunSongEntry[];
  unparsedEntries: string[];
  totalEntries: number;
  // Page state information
  pageState: "loading" | "empty" | "populated" | "error" | "nickname-required";
  stateMessage?: string;
  hasCurrentPerformer: boolean;
}

export class KarafunService {
  private baseAPI: BaseAPIStore;

  constructor(baseAPI: BaseAPIStore) {
    this.baseAPI = baseAPI;
  }

  async parseQueueFromUrl(
    url: string,
    showId?: string
  ): Promise<KarafunQueueData> {
    try {
      const response = await this.baseAPI.post<KarafunQueueData>(
        "/api/karafun/parse",
        { url, showId }
      );
      return response;
    } catch (error) {
      console.error("Failed to parse Karafun queue:", error);
      throw new Error("Failed to parse Karafun queue");
    }
  }

  extractSessionIdFromUrl(url: string): string | null {
    const match = url.match(/karafun\.com\/(\d+)/);
    return match ? match[1] : null;
  }
}
