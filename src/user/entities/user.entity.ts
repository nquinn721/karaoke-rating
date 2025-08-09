import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Rating } from "../../rating/entities/rating.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ type: "text", nullable: true })
  authToken: string; // Non-expiring OAuth token

  @Column({ type: "boolean", default: false })
  isAdmin: boolean; // Admin privileges

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Rating, (rating) => rating.user)
  ratings: Rating[]; // Ratings given by this user

  @OneToMany(() => Rating, (rating) => rating.performer)
  ratingsReceived: Rating[]; // Ratings received by this user as performer
}
