import { Body, Controller, Get, Post, Put, Query } from "@nestjs/common";
import {
  CreateFeedbackDto,
  UpdateFeedbackStatusDto,
} from "./feedback.interface";
import { Feedback } from "./entities/feedback.entity";
import { FeedbackService } from "./feedback.service";

@Controller("api/feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async createFeedback(
    @Body() createFeedbackDto: CreateFeedbackDto
  ): Promise<Feedback> {
    return this.feedbackService.createFeedback(createFeedbackDto);
  }

  @Get()
  async getFeedback(@Query("username") username?: string): Promise<Feedback[]> {
    if (username) {
      return this.feedbackService.getFeedbackByUsername(username);
    }
    return this.feedbackService.getAllFeedback();
  }

  @Put("status")
  async updateFeedbackStatus(
    @Body() updateDto: UpdateFeedbackStatusDto
  ): Promise<Feedback> {
    return this.feedbackService.updateFeedbackStatus(updateDto);
  }
}
