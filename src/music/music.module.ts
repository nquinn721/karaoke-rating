import { Module } from "@nestjs/common";
import { MusicController } from "./music.controller";
import { MusicService } from "./music.service";

@Module({
  controllers: [MusicController],
  providers: [MusicService],
  exports: [MusicService], // Export service so other modules can use it
})
export class MusicModule {}
