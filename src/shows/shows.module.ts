import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatModule } from "../chat/chat.module";
import { ShowsController } from "./shows.controller";
import { ShowsService } from "./shows.service";
import { Show } from "./entities/show.entity";

@Module({
  imports: [ChatModule, TypeOrmModule.forFeature([Show])],
  controllers: [ShowsController],
  providers: [ShowsService],
  exports: [ShowsService, TypeOrmModule],
})
export class ShowsModule {}
