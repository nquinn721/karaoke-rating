import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { Rating } from './entities/rating.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Rating]), UserModule],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService, TypeOrmModule],
})
export class RatingModule {}
