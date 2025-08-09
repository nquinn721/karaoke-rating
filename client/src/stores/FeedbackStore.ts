import { makeObservable, observable, action } from 'mobx';
import { BaseAPIStore } from './BaseAPIStore';

export interface Feedback {
  id: string;
  username: string;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  subject: string;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeedbackDto {
  username: string;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  subject: string;
  message: string;
}

export class FeedbackStore extends BaseAPIStore {
  feedbackList: Feedback[] = [];
  isLoading = false;

  constructor() {
    super();
    makeObservable(this, {
      feedbackList: observable,
      isLoading: observable,
      submitFeedback: action,
      fetchUserFeedback: action,
      fetchAllFeedback: action,
    });
  }

  async submitFeedback(feedbackData: CreateFeedbackDto): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.post('/api/feedback', feedbackData);
      // Optionally add to local list or refetch
      console.log('Feedback submitted successfully:', response);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async fetchUserFeedback(username: string): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.get(`/api/feedback?username=${username}`);
      this.feedbackList = response.map((feedback: any) => ({
        ...feedback,
        createdAt: new Date(feedback.createdAt),
        updatedAt: new Date(feedback.updatedAt),
      }));
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async fetchAllFeedback(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.get('/api/feedback');
      this.feedbackList = response.map((feedback: any) => ({
        ...feedback,
        createdAt: new Date(feedback.createdAt),
        updatedAt: new Date(feedback.updatedAt),
      }));
    } catch (error) {
      console.error('Error fetching all feedback:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }
}
