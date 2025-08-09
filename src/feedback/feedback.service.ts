import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  CreateFeedbackDto,
  UpdateFeedbackStatusDto,
} from "./feedback.interface";
import { Feedback, FeedbackStatus } from "./entities/feedback.entity";
import { ChatGateway } from "../chat/chat.gateway";

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async createFeedback(
    createFeedbackDto: CreateFeedbackDto
  ): Promise<Feedback> {
    const feedback = this.feedbackRepository.create({
      ...createFeedbackDto,
      status: FeedbackStatus.PENDING,
    });

    const saved = await this.feedbackRepository.save(feedback);

    // notify admins via socket
    try {
      this.chatGateway.server.emit("adminFeedbackAdded", saved);
    } catch {}

    return saved;
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

    const updated = await this.feedbackRepository.findOne({
      where: { id: updateDto.id },
    });

    // notify admins via socket
    try {
      if (updated) this.chatGateway.server.emit("adminFeedbackUpdated", updated);
    } catch {}

    return updated;
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
