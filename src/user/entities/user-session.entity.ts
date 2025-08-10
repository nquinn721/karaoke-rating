import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("user_sessions")
export class UserSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  socketId: string;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  showId: string;

  @Column({ type: "json", nullable: true })
  metadata: any;

  @CreateDateColumn()
  connectedAt: Date;

  @UpdateDateColumn()
  lastActivity: Date;

  @Column({ default: true })
  isActive: boolean;
}
