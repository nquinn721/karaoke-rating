import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ChatGateway } from "../chat/chat.gateway";
import { Rating } from "../rating/entities/rating.entity";
import { User } from "../user/entities/user.entity";
import { Show } from "./entities/show.entity";
import {
  CreateShowDto,
  JoinShowDto,
  LeaveShowDto,
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
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway
  ) {}

  private async getUsernameById(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ["username"],
    });
    return user?.username || "Unknown User";
  }

  private async getUsernamesByIds(userIds: number[]): Promise<string[]> {
    if (!userIds || userIds.length === 0) return [];
    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      select: ["username"],
    });
    return users.map((user) => user.username);
  }

  async createShow(createShowDto: CreateShowDto): Promise<ShowInterface> {
    const show = this.showRepository.create({
      name: createShowDto.name,
      venue: createShowDto.venue,
      participants: [],
      queue: [],
    });

    const savedShow = await this.showRepository.save(show);

    // Convert to interface format
    const participantNames = await this.getUsernamesByIds(
      savedShow.participants || []
    );
    const showInterface: ShowInterface = {
      id: savedShow.id.toString(),
      name: savedShow.name,
      venue: savedShow.venue as "karafun" | "excess" | "dj steve",
      participants: participantNames,
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
      where: { isValid: true }, // Only return valid shows
      relations: ["ratings", "ratings.performer"],
      order: { createdAt: "DESC" },
    });

    // Process each show with async operations
    const processedShows = await Promise.all(
      shows.map(async (show) => ({
        id: show.id.toString(),
        name: show.name,
        venue: show.venue as "karafun" | "excess" | "dj steve",
        participants: await this.getUsernamesByIds(show.participants || []),
        ratings:
          show.ratings?.map((rating) => ({
            id: rating.id.toString(),
            rating: Number(rating.score),
            comment: rating.comment || "",
            ratedBy: rating.performer?.username || "",
            singer: rating.performer?.username || "",
            song: rating.songTitle || "",
            createdAt: rating.createdAt,
            showId: rating.showId?.toString() || "",
          })) || [],
        createdAt: show.createdAt,
        isValid: show.isValid,
        queue: show.queue || [],
        currentSinger: show.currentSingerId
          ? await this.getUsernameById(show.currentSingerId)
          : undefined,
        currentSong: show.currentSong,
      }))
    );

    return processedShows;
  }

  async getAllShowsIncludingInvalid(): Promise<ShowInterface[]> {
    const shows = await this.showRepository.find({
      // No where clause - return all shows regardless of isValid status
      relations: ["ratings", "ratings.performer"],
      order: { createdAt: "DESC" },
    });

    // Process each show with async operations
    const processedShows = await Promise.all(
      shows.map(async (show) => ({
        id: show.id.toString(),
        name: show.name,
        venue: show.venue as "karafun" | "excess" | "dj steve",
        participants: await this.getUsernamesByIds(show.participants || []),
        ratings:
          show.ratings?.map((rating) => ({
            id: rating.id.toString(),
            rating: Number(rating.score),
            comment: rating.comment || "",
            ratedBy: rating.performer?.username || "",
            singer: rating.performer?.username || "",
            song: rating.songTitle || "",
            createdAt: rating.createdAt,
            showId: rating.showId?.toString() || "",
          })) || [],
        createdAt: show.createdAt,
        isValid: show.isValid,
        queue: show.queue || [],
        currentSinger: show.currentSingerId
          ? await this.getUsernameById(show.currentSingerId)
          : undefined,
        currentSong: show.currentSong,
      }))
    );

    return processedShows;
  }

  async getShow(id: string): Promise<ShowInterface | undefined> {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return undefined; // Return undefined for invalid IDs
    }

    const show = await this.showRepository.findOne({
      where: { id: numericId },
      relations: ["ratings", "ratings.performer"],
    });

    if (!show) return undefined;

    return {
      id: show.id.toString(),
      name: show.name,
      venue: show.venue as "karafun" | "excess" | "dj steve",
      participants: await this.getUsernamesByIds(show.participants || []),
      ratings:
        show.ratings?.map((rating) => ({
          id: rating.id.toString(),
          rating: Number(rating.score),
          comment: rating.comment || "",
          ratedBy: rating.performer?.username || "",
          singer: rating.performer?.username || "",
          song: rating.songTitle || "",
          createdAt: rating.createdAt,
          showId: rating.showId?.toString() || "",
        })) || [],
      createdAt: show.createdAt,
      isValid: show.isValid,
      queue: show.queue || [],
      currentSinger: show.currentSingerId
        ? await this.getUsernameById(show.currentSingerId)
        : undefined,
      currentSong: show.currentSong,
    };
  }

  async joinShow(joinShowDto: JoinShowDto): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(joinShowDto.showId) },
    });

    if (!show) return undefined;

    const participants = show.participants || [];
    if (!participants.includes(joinShowDto.userId)) {
      participants.push(joinShowDto.userId);
      show.participants = participants;
      await this.showRepository.save(show);

      // Broadcast shows update
      const allShows = await this.getAllShows();
      this.chatGateway.server.emit("showsUpdated", allShows);
    }

    return this.getShow(joinShowDto.showId);
  }

  async leaveShow(
    leaveShowDto: LeaveShowDto
  ): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(leaveShowDto.showId) },
    });

    if (!show) return undefined;

    const participants = show.participants || [];
    const index = participants.indexOf(leaveShowDto.userId);
    if (index > -1) {
      participants.splice(index, 1);
      show.participants = participants;
      await this.showRepository.save(show);

      // Broadcast shows update
      const allShows = await this.getAllShows();
      this.chatGateway.server.emit("showsUpdated", allShows);
    }

    return this.getShow(leaveShowDto.showId);
  }

  async updateCurrentPerformer(
    showId: string,
    singerId: number,
    song: string
  ): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(showId) },
    });

    if (!show) return undefined;

    show.currentSingerId = singerId;
    show.currentSong = song;
    await this.showRepository.save(show);

    const allShows = await this.getAllShows();
    this.chatGateway.server.emit("showsUpdated", allShows);

    // Inform room subscribers of performer change
    const singerName = await this.getUsernameById(singerId);
    this.chatGateway.server.to(showId).emit("currentPerformerChanged", {
      singer: singerName,
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
      // Find the user ID for the next singer
      const user = await this.userRepository.findOne({
        where: { username: next.singer },
      });
      show.currentSingerId = user?.id;
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

    // Find the performer by username
    const performer = await this.userRepository.findOne({
      where: { username: rateDto.singer },
    });

    if (!performer) {
      throw new Error(`Performer ${rateDto.singer} not found`);
    }

    const rating = this.ratingRepository.create({
      score: rateDto.rating,
      comment: rateDto.comment || "",
      songTitle: rateDto.song,
      userId: user.id,
      performerId: performer.id,
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
      singer: rating.performer.username,
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

  async invalidateAllShows(): Promise<{ affected: number }> {
    const result = await this.showRepository.update(
      { isValid: true }, // Only update currently valid shows
      { isValid: false }
    );
    return { affected: result.affected || 0 };
  }

  async deleteShow(id: string): Promise<{ success: boolean; message: string }> {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return { success: false, message: "Invalid show ID" };
    }

    try {
      // First check if show exists
      const show = await this.showRepository.findOne({
        where: { id: numericId },
        relations: ["ratings"],
      });

      if (!show) {
        return { success: false, message: "Show not found" };
      }

      // Delete associated ratings first (if any)
      if (show.ratings && show.ratings.length > 0) {
        await this.ratingRepository.delete({ showId: numericId });
      }

      // Delete the show
      await this.showRepository.delete(numericId);

      return {
        success: true,
        message: `Show "${show.name}" and ${show.ratings?.length || 0} associated ratings deleted successfully`,
      };
    } catch (error) {
      console.error("Error deleting show:", error);
      return { success: false, message: "Failed to delete show" };
    }
  }

  async deleteAllShows(): Promise<{ affected: number }> {
    try {
      // Delete all ratings first
      await this.ratingRepository.delete({});

      // Then delete all shows
      const result = await this.showRepository.delete({});

      return { affected: result.affected || 0 };
    } catch (error) {
      console.error("Error deleting all shows:", error);
      return { affected: 0 };
    }
  }
}
