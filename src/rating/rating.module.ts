import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "../user/user.module";
import { Rating } from "./entities/rating.entity";
import { RatingController } from "./rating.controller";
import { RatingService } from "./rating.service";

@Module({
  imports: [TypeOrmModule.forFeature([Rating]), UserModule],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService, TypeOrmModule],
})
export class RatingModule {}
