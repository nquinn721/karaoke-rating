export interface QueueItem {
  singer: string;
  song: string;
}

export interface Show {
  id: string;
  name: string;
  venue: "karafun" | "excess" | "dj steve";
  currentSinger?: string; // Display name for interface
  currentSong?: string;
  participants: string[]; // Display names for interface
  ratings: Rating[];
  createdAt: Date;
  isValid?: boolean; // Whether the show is still valid/active
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
  userId: number; // Changed from username to userId
}

export interface LeaveShowDto {
  showId: string;
  userId: number;
}

export interface UpdateCurrentPerformerDto {
  singerId: number;
  song: string;
}

export interface RatePerformanceDto {
  showId: string;
  singer: string;
  song: string;
  rating: number;
  comment?: string;
  ratedBy: string;
}
