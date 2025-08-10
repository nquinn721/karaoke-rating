import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Show } from "../shows/entities/show.entity";
import { SchedulerService } from "./scheduler.service";

@Module({
  imports: [TypeOrmModule.forFeature([Show])],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
