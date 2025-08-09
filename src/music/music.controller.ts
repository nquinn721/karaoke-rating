import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { ArtistSearchResult, MusicSearchResult } from "./music.interface";
import { MusicService } from "./music.service";

@Controller("api/music")
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get("search/songs")
  async searchSongs(
    @Query("q") query: string,
    @Query("limit") limit?: string
  ): Promise<MusicSearchResult[]> {
    if (!query || query.trim().length < 3) {
      throw new BadRequestException("Query must be at least 3 characters long");
    }

    const limitNumber = limit ? parseInt(limit, 10) : 10;
    if (limitNumber > 50) {
      throw new BadRequestException("Limit cannot exceed 50");
    }

    return this.musicService.searchSongs(query.trim(), limitNumber);
  }

  @Get("search/artists")
  async searchArtists(
    @Query("q") query: string,
    @Query("limit") limit?: string
  ): Promise<ArtistSearchResult[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException("Query must be at least 2 characters long");
    }

    const limitNumber = limit ? parseInt(limit, 10) : 10;
    if (limitNumber > 50) {
      throw new BadRequestException("Limit cannot exceed 50");
    }

    return this.musicService.searchArtists(query.trim(), limitNumber);
  }

  @Get("search/combined")
  async searchCombined(
    @Query("q") query: string,
    @Query("limit") limit?: string
  ): Promise<MusicSearchResult[]> {
    if (!query || query.trim().length < 3) {
      throw new BadRequestException("Query must be at least 3 characters long");
    }

    const limitNumber = limit ? parseInt(limit, 10) : 10;
    if (limitNumber > 50) {
      throw new BadRequestException("Limit cannot exceed 50");
    }

    return this.musicService.searchCombined(query.trim(), limitNumber);
  }

  @Get("health")
  async healthCheck(): Promise<{ status: string; service: string }> {
    return {
      status: "healthy",
      service: "MusicBrainz API",
    };
  }
}
