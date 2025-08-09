import { action, makeObservable, observable, runInAction } from "mobx";
import { BaseAPIStore } from "./BaseAPIStore";
import { Show } from "./types";

export class ShowsStore {
  shows: Show[] = [];
  currentShow: Show | null = null;
  loading: boolean = false;
  error: string | null = null;
  private baseAPI: BaseAPIStore;

  constructor(baseAPI: BaseAPIStore) {
    // Explicitly initialize the shows array first
    this.shows = [];
    this.currentShow = null;
    this.loading = false;
    this.error = null;
    this.baseAPI = baseAPI;

    // Then make observable with explicit configuration
    makeObservable(this, {
      shows: observable,
      currentShow: observable,
      loading: observable,
      error: observable,
      fetchShows: action,
      createShow: action,
      joinShow: action,
      fetchShow: action,
      updateCurrentPerformer: action,
      updateCurrentPerformerAPI: action,
      fetchShowRatings: action,
      clearCurrentShow: action,
      addToQueue: action,
      nextPerformance: action,
    });
  }

  // Normalize server responses to ensure arrays are always defined
  private normalizeShow = (show: any): Show => {
    return {
      id: show.id,
      name: show.name ?? "",
      venue: show.venue ?? "karafun",
      currentSinger: show.currentSinger ?? undefined,
      currentSong: show.currentSong ?? undefined,
      participants: Array.isArray(show.participants) ? show.participants : [],
      ratings: Array.isArray(show.ratings) ? show.ratings : [],
      createdAt: show.createdAt ? new Date(show.createdAt) : new Date(),
    };
  };

  async fetchShows() {
    this.loading = true;
    this.error = null;

    try {
      const shows = await this.baseAPI.get<Show[]>("/api/shows");

      runInAction(() => {
        const list = Array.isArray(shows)
          ? shows.map((s: any) => this.normalizeShow(s))
          : [];
        this.shows = list;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
        this.loading = false;
      });
    }
  }

  async createShow(name: string, venue: "karafun" | "excess" | "dj steve") {
    this.loading = true;
    this.error = null;

    try {
      const newShow = await this.baseAPI.post<Show>("/api/shows", {
        name,
        venue,
      });

      const normalized = this.normalizeShow(newShow as any);
      runInAction(() => {
        this.shows.push(normalized);
        this.loading = false;
      });

      return normalized;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
        this.loading = false;
      });
      throw error;
    }
  }

  async joinShow(showId: string, username: string) {
    try {
      const updatedShow = await this.baseAPI.post<Show>("/api/shows/join", {
        showId,
        username,
      });

      const normalized = this.normalizeShow(updatedShow as any);
      runInAction(() => {
        const index = this.shows.findIndex((s) => s.id === showId);
        if (index !== -1) {
          this.shows[index] = normalized;
        } else {
          this.shows.push(normalized);
        }
        this.currentShow = normalized;
      });

      return normalized;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    }
  }

  async fetchShow(id: string) {
    this.loading = true;
    this.error = null;

    try {
      const show = await this.baseAPI.get<Show>(`/api/shows/${id}`);

      const normalized = this.normalizeShow(show as any);
      runInAction(() => {
        this.currentShow = normalized;
        this.loading = false;
      });

      return normalized;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
        this.loading = false;
      });
      throw error;
    }
  }

  async ratePerformance(
    showId: string,
    singer: string,
    song: string,
    rating: number,
    comment: string,
    ratedBy: string
  ) {
    try {
      const newRating = await this.baseAPI.post("/api/shows/rate", {
        showId,
        singer,
        song,
        rating,
        comment,
        ratedBy,
      });

      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          if (!Array.isArray(this.currentShow.ratings)) {
            this.currentShow.ratings = [] as any;
          }
          this.currentShow.ratings.push(newRating as any);
        }
      });

      return newRating;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    }
  }

  updateCurrentPerformer(singer: string, song: string) {
    if (this.currentShow) {
      this.currentShow.currentSinger = singer;
      this.currentShow.currentSong = song;
    }
  }

  async updateCurrentPerformerAPI(
    showId: string,
    singer: string,
    song: string
  ) {
    try {
      const updatedShow = await this.baseAPI.patch<Show>(
        `/api/shows/${showId}/current-performer`,
        {
          singer,
          song,
        }
      );

      const normalized = this.normalizeShow(updatedShow as any);
      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          this.currentShow.currentSinger = singer;
          this.currentShow.currentSong = song;
        }
        // Update in shows list as well
        const index = this.shows.findIndex((s) => s.id === showId);
        if (index !== -1) {
          this.shows[index] = normalized;
        } else {
          this.shows.push(normalized);
        }
      });

      return normalized;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    }
  }

  async fetchShowRatings(showId: string) {
    try {
      const ratings = await this.baseAPI.get(`/api/shows/${showId}/ratings`);
      return ratings;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    }
  }

  async addToQueue(showId: string, singer: string, song: string) {
    try {
      const updated = await this.baseAPI.post<Show>(`/api/shows/${showId}/queue`, {
        singer,
        song,
      });
      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          this.currentShow.queue = updated.queue || [] as any;
        }
        const index = this.shows.findIndex((s) => s.id === showId);
        if (index !== -1) this.shows[index] = updated;
      });
      return updated;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    }
  }

  async nextPerformance(showId: string) {
    try {
      const updated = await this.baseAPI.post<Show>(`/api/shows/${showId}/next`, {});
      runInAction(() => {
        if (this.currentShow && this.currentShow.id === showId) {
          this.currentShow.currentSinger = updated.currentSinger;
          this.currentShow.currentSong = updated.currentSong;
          this.currentShow.queue = updated.queue || [] as any;
        }
        const index = this.shows.findIndex((s) => s.id === showId);
        if (index !== -1) this.shows[index] = updated;
      });
      return updated;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    }
  }

  clearCurrentShow() {
    this.currentShow = null;
  }
}
