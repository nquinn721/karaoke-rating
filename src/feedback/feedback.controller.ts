import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { Feedback } from "./entities/feedback.entity";
import {
  CreateFeedbackDto,
  UpdateFeedbackStatusDto,
} from "./feedback.interface";
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

  @Delete(":id")
  async deleteFeedback(
    @Param("id") id: string
  ): Promise<{ success: boolean; message: string }> {
    await this.feedbackService.deleteFeedback(id);
    return { success: true, message: "Feedback deleted successfully" };
  }
}
