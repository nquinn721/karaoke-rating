import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ArtistSearchResult, MusicSearchResult } from "./music.interface";

@Injectable()
export class MusicService {
  private readonly baseURL = "https://musicbrainz.org/ws/2";
  private readonly userAgent = "KaraokeRatingsApp/1.0.0";
  private readonly rateLimit = 1000; // MusicBrainz rate limit: ~1 request per second

  private lastRequestTime = 0;

  private async makeRequest(url: string): Promise<any> {
    // Respect rate limit
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimit) {
      const waitTime = this.rateLimit - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
        },
      });

      if (!response.ok) {
        throw new HttpException(
          `MusicBrainz API error: ${response.status}`,
          HttpStatus.BAD_GATEWAY
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to fetch music data",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchSongs(query: string, limit = 10): Promise<MusicSearchResult[]> {
    if (query.length < 3) {
      return [];
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseURL}/recording?query=recording:${encodedQuery}&fmt=json&limit=${limit}`;

      const data = await this.makeRequest(url);

      return (
        data.recordings?.map((recording: any) => ({
          id: recording.id,
          title: recording.title,
          artist: recording["artist-credit"]?.[0]?.name || "Unknown Artist",
          album: recording.releases?.[0]?.title,
          year: recording.releases?.[0]?.date?.split("-")[0],
        })) || []
      );
    } catch (error) {
      console.error("Music search error:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Music search failed",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchArtists(
    query: string,
    limit = 10
  ): Promise<ArtistSearchResult[]> {
    if (query.length < 2) {
      return [];
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseURL}/artist?query=artist:${encodedQuery}&fmt=json&limit=${limit}`;

      const data = await this.makeRequest(url);

      return (
        data.artists?.map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          disambiguation: artist.disambiguation,
          country: artist.country,
        })) || []
      );
    } catch (error) {
      console.error("Artist search error:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Artist search failed",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchCombined(
    query: string,
    limit = 10
  ): Promise<MusicSearchResult[]> {
    if (query.length < 3) {
      return [];
    }

    try {
      // Search by recording title and artist name for better results
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseURL}/recording?query=(recording:${encodedQuery} OR artist:${encodedQuery})&fmt=json&limit=${limit}`;

      const data = await this.makeRequest(url);

      return (
        data.recordings?.map((recording: any) => ({
          id: recording.id,
          title: recording.title,
          artist: recording["artist-credit"]?.[0]?.name || "Unknown Artist",
          album: recording.releases?.[0]?.title,
          year: recording.releases?.[0]?.date?.split("-")[0],
        })) || []
      );
    } catch (error) {
      console.error("Combined search error:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Music search failed",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
