import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatModule } from "../chat/chat.module";
import { Rating } from "../rating/entities/rating.entity";
import { User } from "../user/entities/user.entity";
import { Show } from "./entities/show.entity";
import { ShowsController } from "./shows.controller";
import { ShowsService } from "./shows.service";

@Module({
  imports: [
    forwardRef(() => ChatModule),
    TypeOrmModule.forFeature([Show, Rating, User]),
  ],
  controllers: [ShowsController],
  providers: [ShowsService],
  exports: [ShowsService, TypeOrmModule],
})
export class ShowsModule {}
