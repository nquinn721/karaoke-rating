import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  CreateFeedbackDto,
  UpdateFeedbackStatusDto,
} from "./feedback.interface";
import { Feedback, FeedbackStatus } from "./entities/feedback.entity";

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
  ) {}

  async createFeedback(
    createFeedbackDto: CreateFeedbackDto
  ): Promise<Feedback> {
    const feedback = this.feedbackRepository.create({
      ...createFeedbackDto,
      status: FeedbackStatus.PENDING,
    });

    return await this.feedbackRepository.save(feedback);
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return await this.feedbackRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getFeedbackByUsername(username: string): Promise<Feedback[]> {
    return await this.feedbackRepository.find({
      where: { username },
      order: { createdAt: 'DESC' },
    });
  }

  async updateFeedbackStatus(
    updateDto: UpdateFeedbackStatusDto
  ): Promise<Feedback> {
    await this.feedbackRepository.update(updateDto.id, {
      status: updateDto.status,
    });

    return await this.feedbackRepository.findOne({
      where: { id: updateDto.id },
    });
  }

  async findById(id: string): Promise<Feedback> {
    return await this.feedbackRepository.findOne({
      where: { id },
    });
  }

  async deleteFeedback(id: string): Promise<void> {
    await this.feedbackRepository.delete(id);
  }
}
