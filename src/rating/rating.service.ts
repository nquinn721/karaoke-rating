import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { UserService } from '../user/user.service';

export interface CreateRatingDto {
  username: string;
  showId: number;
  score: number;
  comment?: string;
  performerName?: string;
  songTitle?: string;
}

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private ratingRepository: Repository<Rating>,
    private userService: UserService,
  ) {}

  async createRating(createRatingDto: CreateRatingDto): Promise<Rating> {
    const user = await this.userService.findOrCreateUser(createRatingDto.username);
    
    const rating = this.ratingRepository.create({
      ...createRatingDto,
      userId: user.id,
    });

    return this.ratingRepository.save(rating);
  }

  async getRatingsByShow(showId: number): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { showId },
      relations: ['user', 'show'],
      order: { createdAt: 'DESC' }
    });
  }

  async getRatingsByUser(username: string): Promise<Rating[]> {
    const user = await this.userService.findByUsername(username);
    if (!user) return [];

    return this.ratingRepository.find({
      where: { userId: user.id },
      relations: ['show'],
      order: { createdAt: 'DESC' }
    });
  }

  async getAverageRatingForShow(showId: number): Promise<number> {
    const result = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.score)', 'average')
      .where('rating.showId = :showId', { showId })
      .getRawOne();

    return parseFloat(result.average) || 0;
  }

  async getAllRatings(): Promise<Rating[]> {
    return this.ratingRepository.find({
      relations: ['user', 'show'],
      order: { createdAt: 'DESC' }
    });
  }
}
