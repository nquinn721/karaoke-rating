import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Rating } from "../../rating/entities/rating.entity";

@Entity("shows")
export class Show {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  venue: string;

  @Column({ type: "json", nullable: true })
  participants: string[]; // Array of usernames

  @Column({ type: "json", nullable: true })
  queue: any[]; // Queue items for karaoke

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Rating, (rating) => rating.show)
  ratings: Rating[];
}
