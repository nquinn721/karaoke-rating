import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Show } from '../../shows/entities/show.entity';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  score: number; // Rating score (e.g., 4.5)

  @Column({ type: 'text', nullable: true })
  comment: string; // Optional comment

  @Column({ length: 100, nullable: true })
  performerName: string; // Name of the performer being rated

  @Column({ length: 200, nullable: true })
  songTitle: string; // Song that was performed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Show, (show) => show.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'showId' })
  show: Show;

  @Column()
  showId: number;
}
