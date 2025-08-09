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
  participants: number[]; // Array of user IDs

  @Column({ type: "json", nullable: true })
  queue: any[]; // Queue items for karaoke

  @Column({ type: "int", nullable: true })
  currentSingerId: number; // Current performer ID

  @Column({ length: 200, nullable: true })
  currentSong: string; // Current song being performed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Rating, (rating) => rating.show)
  ratings: Rating[];
}
