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
  // Upcoming performances queue
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

export interface ChatMessage {
  id: string;
  showId: string;
  username: string;
  message: string;
  timestamp: Date;
}
