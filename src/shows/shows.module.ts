import { Module } from "@nestjs/common";
import { ChatModule } from "../chat/chat.module";
import { ShowsController } from "./shows.controller";
import { ShowsService } from "./shows.service";

@Module({
  imports: [ChatModule],
  controllers: [ShowsController],
  providers: [ShowsService],
  exports: [ShowsService],
})
export class ShowsModule {}
