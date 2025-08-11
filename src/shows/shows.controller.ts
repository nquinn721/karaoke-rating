import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import {
  CreateShowDto,
  JoinShowDto,
  LeaveShowDto,
  QueueItem,
  RatePerformanceDto,
  Rating,
  Show,
  UpdateCurrentPerformerDto,
} from "./shows.interface";
import { ShowsService } from "./shows.service";

@Controller("api/shows")
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Post()
  async createShow(@Body() createShowDto: CreateShowDto): Promise<Show> {
    return this.showsService.createShow(createShowDto);
  }

  @Get()
  async getAllShows(): Promise<Show[]> {
    return this.showsService.getAllShows();
  }

  @Get(":id")
  async getShow(@Param("id") id: string): Promise<Show | undefined> {
    return this.showsService.getShow(id);
  }

  @Post("join")
  async joinShow(@Body() joinShowDto: JoinShowDto): Promise<Show | undefined> {
    return this.showsService.joinShow(joinShowDto);
  }

  @Post("leave")
  async leaveShow(
    @Body() leaveShowDto: LeaveShowDto
  ): Promise<Show | undefined> {
    return this.showsService.leaveShow(leaveShowDto);
  }

  @Patch(":id/current-performer")
  async updateCurrentPerformer(
    @Param("id") id: string,
    @Body() body: UpdateCurrentPerformerDto
  ): Promise<Show | undefined> {
    return this.showsService.updateCurrentPerformer(id, body.singer, body.song);
  }

  @Post("rate")
  async ratePerformance(@Body() rateDto: RatePerformanceDto): Promise<Rating> {
    return this.showsService.ratePerformance(rateDto);
  }

  @Get(":id/ratings")
  async getShowRatings(@Param("id") id: string): Promise<Rating[]> {
    return this.showsService.getShowRatings(id);
  }

  @Get(":id/has-rated/:username")
  async hasUserRatedCurrentPerformance(
    @Param("id") id: string,
    @Param("username") username: string
  ): Promise<{ hasRated: boolean; performer?: string; song?: string }> {
    return this.showsService.hasUserRatedCurrentPerformance(id, username);
  }

  @Post(":id/queue")
  async addToQueue(
    @Param("id") id: string,
    @Body() item: QueueItem
  ): Promise<Show | undefined> {
    return this.showsService.addToQueue(id, item);
  }

  @Post(":id/next")
  async nextPerformance(@Param("id") id: string): Promise<Show | undefined> {
    return this.showsService.advanceQueue(id);
  }

  @Delete(":id/queue/item")
  async removeQueueItem(
    @Param("id") id: string,
    @Body() body: { index: number }
  ): Promise<Show | undefined> {
    return this.showsService.removeQueueItem(id, body.index);
  }

  @Delete(":id/queue/by-singer")
  async removeQueueBySinger(
    @Param("id") id: string,
    @Body() body: { singer: string }
  ): Promise<Show | undefined> {
    return this.showsService.removeQueueBySinger(id, body.singer);
  }

  @Post("admin/invalidate-all")
  @UseGuards(AdminGuard)
  async invalidateAllShows(): Promise<{ affected: number }> {
    return this.showsService.invalidateAllShows();
  }

  @Get("admin/all")
  @UseGuards(AdminGuard)
  async getAllShowsIncludingInvalid(): Promise<Show[]> {
    return this.showsService.getAllShowsIncludingInvalid();
  }

  @Delete("admin/delete-all")
  @UseGuards(AdminGuard)
  async deleteAllShows(): Promise<{ affected: number }> {
    return this.showsService.deleteAllShows();
  }

  @Delete("admin/:id")
  @UseGuards(AdminGuard)
  async deleteShow(
    @Param("id") id: string
  ): Promise<{ success: boolean; message: string }> {
    return this.showsService.deleteShow(id);
  }
}
