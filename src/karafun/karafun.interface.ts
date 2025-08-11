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
  // Unique singer names (simple string array)
  uniqueSingers: string[];
  // Page state information
  pageState: "loading" | "empty" | "populated" | "error" | "nickname-required";
  stateMessage?: string;
  hasCurrentPerformer: boolean;
}

export interface ParseKarafunUrlDto {
  url: string;
  showId?: string; // Optional showId for broadcasting updates
}
