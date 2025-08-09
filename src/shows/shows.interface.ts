export interface QueueItem {
  singer: string;
  song: string;
}

export interface Show {
  id: string;
  name: string;
  venue: "karafun" | "excess" | "dj steve";
  currentSinger?: string;
  currentSong?: string;
  participants: string[];
  ratings: Rating[];
  createdAt: Date;
  // New: upcoming performances queue
  queue: QueueItem[];
}

export interface Rating {
  id: string;
  showId: string;
  singer: string;
  song: string;
  rating: number;
  comment?: string;
  ratedBy: string;
  createdAt: Date;
}

export interface CreateShowDto {
  name: string;
  venue: "karafun" | "excess" | "dj steve";
}

export interface JoinShowDto {
  showId: string;
  username: string;
}

export interface RatePerformanceDto {
  showId: string;
  singer: string;
  song: string;
  rating: number;
  comment?: string;
  ratedBy: string;
}
