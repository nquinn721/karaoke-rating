import { FeedbackStatus, FeedbackType } from "./entities/feedback.entity";

export interface Feedback {
  id: string;
  username: string;
  type: FeedbackType;
  subject: string;
  message: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeedbackDto {
  username: string;
  type: FeedbackType;
  subject: string;
  message: string;
}

export interface UpdateFeedbackStatusDto {
  id: string;
  status: FeedbackStatus;
}
