import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import {
  CreateShowDto,
  JoinShowDto,
  QueueItem,
  RatePerformanceDto,
  Rating,
  Show,
} from "./shows.interface";
import { ShowsService } from "./shows.service";

@Controller("api/shows")
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Post()
  createShow(@Body() createShowDto: CreateShowDto): Show {
    return this.showsService.createShow(createShowDto);
  }

  @Get()
  getAllShows(): Show[] {
    return this.showsService.getAllShows();
  }

  @Get(":id")
  getShow(@Param("id") id: string): Show | undefined {
    return this.showsService.getShow(id);
  }

  @Post("join")
  joinShow(@Body() joinShowDto: JoinShowDto): Show | undefined {
    return this.showsService.joinShow(joinShowDto);
  }

  @Patch(":id/current-performer")
  updateCurrentPerformer(
    @Param("id") id: string,
    @Body() body: { singer: string; song: string }
  ): Show | undefined {
    return this.showsService.updateCurrentPerformer(id, body.singer, body.song);
  }

  @Post("rate")
  ratePerformance(@Body() rateDto: RatePerformanceDto): Rating {
    return this.showsService.ratePerformance(rateDto);
  }

  @Get(":id/ratings")
  getShowRatings(@Param("id") id: string): Rating[] {
    return this.showsService.getShowRatings(id);
  }

  @Post(":id/queue")
  addToQueue(
    @Param("id") id: string,
    @Body() item: QueueItem
  ): Show | undefined {
    return this.showsService.addToQueue(id, item);
  }

  @Post(":id/next")
  nextPerformance(@Param("id") id: string): Show | undefined {
    return this.showsService.advanceQueue(id);
  }

  @Delete(":id/queue/item")
  removeQueueItem(
    @Param("id") id: string,
    @Body() body: { index: number }
  ): Show | undefined {
    return this.showsService.removeQueueItem(id, body.index);
  }

  @Delete(":id/queue/by-singer")
  removeQueueBySinger(
    @Param("id") id: string,
    @Body() body: { singer: string }
  ): Show | undefined {
    return this.showsService.removeQueueBySinger(id, body.singer);
  }
}
