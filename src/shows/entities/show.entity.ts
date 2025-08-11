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
  totalAttendees: number[]; // Array of all unique user IDs who have ever joined

  @Column({ type: "json", nullable: true })
  queue: any[]; // Queue items for karaoke

  @Column({ type: "int", nullable: true })
  currentSingerId: number; // Current performer ID

  @Column({ length: 200, nullable: true })
  currentSong: string; // Current song being performed

  @Column({ default: true })
  isValid: boolean; // Whether the show is still valid/active

  @Column({
    length: 500,
    nullable: true,
    default: "https://www.karafun.com/karaokebar/080601",
  })
  karafunUrl: string; // Karafun session URL from QR code scan

  @Column({ length: 100, nullable: true })
  karafunCurrentSinger: string; // Current Karafun singer (may not exist in our user database)

  @Column({ type: "json", nullable: true })
  karafunCachedData: any; // Cached Karafun queue data

  @Column({ type: "datetime", nullable: true })
  karafunLastParsed: Date; // Last time Karafun data was parsed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Rating, (rating) => rating.show)
  ratings: Rating[];

  @Column({ type: "json", nullable: true })
  singerOrder: string[]; // Array of singer usernames in order
}
