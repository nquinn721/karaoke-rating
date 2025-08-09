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
      venue: savedShow.venue as "karafun" | "excess" | "dj steve",
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

    return shows.map((show) => ({
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

  async addToQueue(
    showId: string,
    item: QueueItem
  ): Promise<ShowInterface | undefined> {
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

  async ratePerformance(rateDto: RatePerformanceDto): Promise<RatingInterface> {
    // Find the user by username to get their ID
    let user = await this.userRepository.findOne({
      where: { username: rateDto.ratedBy },
    });

    // Create user if doesn't exist
    if (!user) {
      user = this.userRepository.create({
        username: rateDto.ratedBy,
        isAdmin: false,
      });
      user = await this.userRepository.save(user);
    }

    const rating = this.ratingRepository.create({
      score: rateDto.rating,
      comment: rateDto.comment || "",
      performerName: rateDto.singer,
      songTitle: rateDto.song,
      userId: user.id,
      showId: parseInt(rateDto.showId),
    });

    const savedRating = await this.ratingRepository.save(rating);

    // Notify clients
    this.chatGateway.server.to(rateDto.showId).emit("ratingAdded", {
      rating: savedRating,
    });

    return {
      id: savedRating.id.toString(),
      comment: savedRating.comment,
      ratedBy: rateDto.ratedBy,
      singer: rateDto.singer,
      song: rateDto.song,
      rating: savedRating.score,
      createdAt: savedRating.createdAt,
      showId: rateDto.showId,
    };
  }

  async getShowRatings(showId: string): Promise<RatingInterface[]> {
    const ratings = await this.ratingRepository.find({
      where: { showId: parseInt(showId) },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });

    return ratings.map((rating) => ({
      id: rating.id.toString(),
      rating: rating.score,
      comment: rating.comment,
      ratedBy: rating.user.username,
      singer: rating.performerName,
      song: rating.songTitle,
      createdAt: rating.createdAt,
      showId: showId,
    }));
  }

  async removeQueueItem(
    showId: string,
    index: number
  ): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(showId) },
    });

    if (!show) return undefined;

    const queue = show.queue || [];
    if (index >= 0 && index < queue.length) {
      queue.splice(index, 1);
      show.queue = queue;
      await this.showRepository.save(show);

      // Notify clients
      this.chatGateway.server.to(showId).emit("queueUpdated", {
        showId,
        queue: show.queue,
      });
    }

    return this.getShow(showId);
  }

  async removeQueueBySinger(
    showId: string,
    singer: string
  ): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(showId) },
    });

    if (!show) return undefined;

    const queue = show.queue || [];
    const initialLength = queue.length;
    show.queue = queue.filter((item: any) => item.singer !== singer);

    // Only save and broadcast if something was removed
    if (show.queue.length !== initialLength) {
      await this.showRepository.save(show);

      // Notify clients
      this.chatGateway.server.to(showId).emit("queueUpdated", {
        showId,
        queue: show.queue,
      });
    }

    return this.getShow(showId);
  }
}
