import { Injectable } from "@nestjs/common";
import { ChatGateway } from "../chat/chat.gateway";
import {
  CreateShowDto,
  JoinShowDto,
  QueueItem,
  RatePerformanceDto,
  Rating,
  Show,
} from "./shows.interface";

@Injectable()
export class ShowsService {
  private shows: Show[] = [];
  private ratings: Rating[] = [];

  constructor(private readonly chatGateway: ChatGateway) {}

  createShow(createShowDto: CreateShowDto): Show {
    const show: Show = {
      id: Math.random().toString(36).substr(2, 9),
      name: createShowDto.name,
      venue: createShowDto.venue,
      participants: [],
      ratings: [],
      createdAt: new Date(),
      queue: [],
    };

    this.shows.push(show);

    // Broadcast shows list update via websocket
    this.chatGateway.server.emit("showsUpdated", this.getAllShows());

    return show;
  }

  getAllShows(): Show[] {
    return this.shows;
  }

  getShow(id: string): Show | undefined {
    return this.shows.find((show) => show.id === id);
  }

  joinShow(joinShowDto: JoinShowDto): Show | undefined {
    const show = this.shows.find((s) => s.id === joinShowDto.showId);
    if (show && !show.participants.includes(joinShowDto.username)) {
      show.participants.push(joinShowDto.username);
      // Also broadcast shows update so HomePage participant counts can update on fallback
      this.chatGateway.server.emit("showsUpdated", this.getAllShows());
      // Broadcast participants via chat gateway as well (already handled there)
    }
    return show;
  }

  updateCurrentPerformer(
    showId: string,
    singer: string,
    song: string
  ): Show | undefined {
    const show = this.shows.find((s) => s.id === showId);
    if (show) {
      show.currentSinger = singer;
      show.currentSong = song;
      this.chatGateway.server.emit("showsUpdated", this.getAllShows());
      // Inform room subscribers of performer change
      this.chatGateway.server.to(showId).emit("currentPerformerChanged", {
        singer,
        song,
      });
    }
    return show;
  }

  addToQueue(showId: string, item: QueueItem): Show | undefined {
    const show = this.shows.find((s) => s.id === showId);
    if (!show) return undefined;

    if (!show.queue) show.queue = [];
    show.queue.push({ singer: item.singer, song: item.song });

    // Notify clients of queue change
    this.chatGateway.server.to(showId).emit("queueUpdated", {
      showId,
      queue: show.queue,
    });

    return show;
  }

  advanceQueue(showId: string): Show | undefined {
    const show = this.shows.find((s) => s.id === showId);
    if (!show) return undefined;

    if (!show.queue) show.queue = [];
    const next = show.queue.shift();

    if (next) {
      show.currentSinger = next.singer;
      show.currentSong = next.song;

      // Inform room subscribers
      this.chatGateway.server.to(showId).emit("queueUpdated", {
        showId,
        queue: show.queue,
      });
      this.chatGateway.server.to(showId).emit("currentPerformerChanged", {
        singer: next.singer,
        song: next.song,
      });
    }

    // Also update overall shows list
    this.chatGateway.server.emit("showsUpdated", this.getAllShows());

    return show;
  }

  ratePerformance(rateDto: RatePerformanceDto): Rating {
    const rating: Rating = {
      id: Math.random().toString(36).substr(2, 9),
      showId: rateDto.showId,
      singer: rateDto.singer,
      song: rateDto.song,
      rating: rateDto.rating,
      comment: rateDto.comment,
      ratedBy: rateDto.ratedBy,
      createdAt: new Date(),
    };

    this.ratings.push(rating);

    const show = this.shows.find((s) => s.id === rateDto.showId);
    if (show) {
      show.ratings.push(rating);
    }

    return rating;
  }

  getShowRatings(showId: string): Rating[] {
    return this.ratings.filter((rating) => rating.showId === showId);
  }
}
