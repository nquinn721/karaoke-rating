export interface Feedback {
  id: string;
  username: string;
  type: "bug" | "feature" | "improvement" | "general";
  subject: string;
  message: string;
  status: "pending" | "reviewed" | "resolved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeedbackDto {
  username: string;
  type: "bug" | "feature" | "improvement" | "general";
  subject: string;
  message: string;
}

export interface UpdateFeedbackStatusDto {
  id: string;
  status: "pending" | "reviewed" | "resolved" | "rejected";
}
