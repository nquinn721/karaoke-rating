import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum FeedbackType {
  BUG = "bug",
  FEATURE = "feature",
  IMPROVEMENT = "improvement",
  GENERAL = "general",
}

export enum FeedbackStatus {
  PENDING = "pending",
  REVIEWED = "reviewed",
  RESOLVED = "resolved",
  REJECTED = "rejected",
}

@Entity("feedback")
export class Feedback {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  username: string;

  @Column({
    type: "enum",
    enum: FeedbackType,
    nullable: false,
  })
  type: FeedbackType;

  @Column({ type: "varchar", length: 255, nullable: false })
  subject: string;

  @Column({ type: "text", nullable: false })
  message: string;

  @Column({
    type: "enum",
    enum: FeedbackStatus,
    default: FeedbackStatus.PENDING,
  })
  status: FeedbackStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
