import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatGateway } from "../chat/chat.gateway";
import { Rating } from "../rating/entities/rating.entity";
import { User } from "../user/entities/user.entity";
import { Show } from "./entities/show.entity";
import {
  CreateShowDto,
  JoinShowDto,
  QueueItem,
  RatePerformanceDto,
  Rating as RatingInterface,
  Show as ShowInterface,
} from "./shows.interface";

@Injectable()
export class ShowsService {
  constructor(
    @InjectRepository(Show)
    private readonly showRepository: Repository<Show>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly chatGateway: ChatGateway
  ) {}

  async createShow(createShowDto: CreateShowDto): Promise<ShowInterface> {
    const show = this.showRepository.create({
      name: createShowDto.name,
      venue: createShowDto.venue,
      participants: [],
      queue: [],
    });

    const savedShow = await this.showRepository.save(show);
    
    // Convert to interface format
    const showInterface: ShowInterface = {
      id: savedShow.id.toString(),
      name: savedShow.name,
      venue: savedShow.venue,
      participants: savedShow.participants || [],
      ratings: [],
      createdAt: savedShow.createdAt,
      queue: savedShow.queue || [],
    };

    // Broadcast shows list update via websocket
    const allShows = await this.getAllShows();
    this.chatGateway.server.emit("showsUpdated", allShows);

    return showInterface;
  }

  async getAllShows(): Promise<ShowInterface[]> {
    const shows = await this.showRepository.find({
      relations: ["ratings"],
      order: { createdAt: "DESC" },
    });

    return shows.map(show => ({
      id: show.id.toString(),
      name: show.name,
      venue: show.venue as "karafun" | "excess" | "dj steve",
      participants: show.participants || [],
      ratings: [],
      createdAt: show.createdAt,
      queue: show.queue || [],
      currentSinger: show.currentSinger,
      currentSong: show.currentSong,
    }));
  }

  async getShow(id: string): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["ratings"],
    });

    if (!show) return undefined;

    return {
      id: show.id.toString(),
      name: show.name,
      venue: show.venue as "karafun" | "excess" | "dj steve",
      participants: show.participants || [],
      ratings: [],
      createdAt: show.createdAt,
      queue: show.queue || [],
      currentSinger: show.currentSinger,
      currentSong: show.currentSong,
    };
  }

  async joinShow(joinShowDto: JoinShowDto): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(joinShowDto.showId) },
    });

    if (!show) return undefined;

    const participants = show.participants || [];
    if (!participants.includes(joinShowDto.username)) {
      participants.push(joinShowDto.username);
      show.participants = participants;
      await this.showRepository.save(show);
      
      // Broadcast shows update
      const allShows = await this.getAllShows();
      this.chatGateway.server.emit("showsUpdated", allShows);
    }

    return this.getShow(joinShowDto.showId);
  }

  async updateCurrentPerformer(
    showId: string,
    singer: string,
    song: string
  ): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(showId) },
    });

    if (!show) return undefined;

    show.currentSinger = singer;
    show.currentSong = song;
    await this.showRepository.save(show);

    const allShows = await this.getAllShows();
    this.chatGateway.server.emit("showsUpdated", allShows);
    
    // Inform room subscribers of performer change
    this.chatGateway.server.to(showId).emit("currentPerformerChanged", {
      singer,
      song,
    });

    return this.getShow(showId);
  }

  async addToQueue(showId: string, item: QueueItem): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(showId) },
    });

    if (!show) return undefined;

    const queue = show.queue || [];
    queue.push({ singer: item.singer, song: item.song });
    show.queue = queue;
    await this.showRepository.save(show);

    // Notify clients of queue change
    this.chatGateway.server.to(showId).emit("queueUpdated", {
      showId,
      queue: show.queue,
    });

    return this.getShow(showId);
  }

  async advanceQueue(showId: string): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(showId) },
    });

    if (!show) return undefined;

    const queue = show.queue || [];
    const next = queue.shift();

    if (next) {
      show.currentSinger = next.singer;
      show.currentSong = next.song;
    }

    show.queue = queue;
    await this.showRepository.save(show);

    // Notify clients
    this.chatGateway.server.to(showId).emit("queueUpdated", {
      showId,
      queue: show.queue,
    });

    if (next) {
      this.chatGateway.server.to(showId).emit("currentPerformerChanged", {
        singer: next.singer,
        song: next.song,
      });
    }

    const allShows = await this.getAllShows();
    this.chatGateway.server.emit("showsUpdated", allShows);

    return this.getShow(showId);
  }
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

  removeQueueItem(showId: string, index: number): Show | undefined {
    const show = this.shows.find((s) => s.id === showId);
    if (!show) return undefined;
    if (!show.queue) show.queue = [];
    if (index >= 0 && index < show.queue.length) {
      show.queue.splice(index, 1);
      this.chatGateway.server.to(showId).emit("queueUpdated", {
        showId,
        queue: show.queue,
      });
    }
    return show;
  }

  removeQueueBySinger(showId: string, singer: string): Show | undefined {
    const show = this.shows.find((s) => s.id === showId);
    if (!show) return undefined;
    if (!show.queue) show.queue = [];
    const filtered = show.queue.filter((q) => q.singer !== singer);
    if (filtered.length !== show.queue.length) {
      show.queue = filtered;
      this.chatGateway.server.to(showId).emit("queueUpdated", {
        showId,
        queue: show.queue,
      });
    }
    return show;
  }
}
