import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Show } from "../shows/entities/show.entity";

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Show)
    private readonly showRepository: Repository<Show>
  ) {}

  // Run daily at 10:00 AM
  @Cron("0 10 * * *", {
    name: "invalidateShows",
    timeZone: "America/New_York", // Adjust timezone as needed
  })
  async invalidateAllShows() {
    this.logger.log("Starting daily show invalidation...");

    try {
      // Update all shows to be invalid
      const result = await this.showRepository.update(
        { isValid: true }, // Only update currently valid shows
        { isValid: false }
      );

      this.logger.log(`Successfully invalidated ${result.affected} shows`);
      return { affected: result.affected || 0 };
    } catch (error) {
      this.logger.error("Failed to invalidate shows:", error);
      throw error;
    }
  }

  // Manual trigger for testing purposes
  async manuallyInvalidateAllShows() {
    this.logger.log("Manual show invalidation triggered...");
    return this.invalidateAllShows();
  }
}
