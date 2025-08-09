import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateRatingDto, RatingService } from "./rating.service";

@Controller("api/ratings")
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  async createRating(@Body() createRatingDto: CreateRatingDto) {
    const rating = await this.ratingService.createRating(createRatingDto);
    return { success: true, rating };
  }

  @Get("show/:showId")
  async getRatingsByShow(@Param("showId") showId: number) {
    const ratings = await this.ratingService.getRatingsByShow(showId);
    return { success: true, ratings };
  }

  @Get("user/:username")
  async getRatingsByUser(@Param("username") username: string) {
    const ratings = await this.ratingService.getRatingsByUser(username);
    return { success: true, ratings };
  }

  @Get("show/:showId/average")
  async getAverageRating(@Param("showId") showId: number) {
    const average = await this.ratingService.getAverageRatingForShow(showId);
    return { success: true, average };
  }

  @Get()
  async getAllRatings() {
    const ratings = await this.ratingService.getAllRatings();
    return { success: true, ratings };
  }
}
