import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ChatGateway } from "../chat/chat.gateway";
import { KarafunService } from "../karafun/karafun.service";
import { KarafunSessionManager } from "../karafun/session-manager.service";
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
    private readonly chatGateway: ChatGateway,
    private readonly karafunService: KarafunService,
    private readonly karafunSessionManager: KarafunSessionManager
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
      totalAttendees: [],
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
      totalAttendeeCount: (savedShow.totalAttendees || []).length,
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
        totalAttendeeCount: (show.totalAttendees || []).length,
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
        totalAttendeeCount: (show.totalAttendees || []).length,
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
      totalAttendeeCount: (show.totalAttendees || []).length,
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
      // For Karafun shows, prefer the Karafun singer name over database username
      currentSinger:
        show.venue === "karafun" && show.karafunCurrentSinger
          ? show.karafunCurrentSinger
          : show.currentSingerId
            ? await this.getUsernameById(show.currentSingerId)
            : undefined,
      currentSong: show.currentSong,
      karafunUrl: show.karafunUrl,
      karafunCurrentSinger: show.karafunCurrentSinger,
      karafunCachedData: show.karafunCachedData,
      karafunLastParsed: show.karafunLastParsed,
    };
  }

  async joinShow(joinShowDto: JoinShowDto): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(joinShowDto.showId) },
    });

    if (!show) return undefined;

    const participants = show.participants || [];
    const totalAttendees = show.totalAttendees || [];

    // Add to current participants if not already there
    if (!participants.includes(joinShowDto.userId)) {
      participants.push(joinShowDto.userId);
      show.participants = participants;
    }

    // Add to total unique attendees if not already there
    if (!totalAttendees.includes(joinShowDto.userId)) {
      totalAttendees.push(joinShowDto.userId);
      show.totalAttendees = totalAttendees;
    }

    await this.showRepository.save(show);

    // Broadcast shows update
    const allShows = await this.getAllShows();
    this.chatGateway.server.emit("showsUpdated", allShows);

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
    singer: string,
    song: string
  ): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(showId) },
    });

    if (!show) return undefined;

    // For Karafun shows, only allow registered users (participants in the show)
    if (show.venue === "karafun") {
      // Find user in our database - must exist and be a participant
      const user = await this.userRepository.findOne({
        where: { username: singer },
      });

      if (!user) {
        console.log(
          `❌ Karafun performer "${singer}" is not a registered user, ignoring`
        );
        return undefined;
      }

      // Check if the user is a participant in this show
      const participants = show.participants || [];
      if (!participants.includes(user.id)) {
        console.log(
          `❌ Karafun performer "${singer}" is not a participant in this show, ignoring`
        );
        return undefined;
      }

      show.currentSingerId = user.id;
      show.currentSong = song;
      show.karafunCurrentSinger = singer;

      console.log(
        `✅ Setting Karafun current performer: ${singer} - ${song} (validated registered participant)`
      );
    } else {
      // For regular shows, require user to exist in our database
      const user = await this.userRepository.findOne({
        where: { username: singer },
      });

      if (!user) {
        console.error(`User not found: ${singer}`);
        return undefined;
      }

      show.currentSingerId = user.id;
      show.currentSong = song;
    }

    await this.showRepository.save(show);

    const allShows = await this.getAllShows();
    this.chatGateway.server.emit("showsUpdated", allShows);

    // Inform room subscribers of performer change
    this.chatGateway.server.to(showId).emit("currentPerformerChanged", {
      showId,
      singer: singer, // Use the username directly
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

    if (!show) {
      return undefined;
    }

    const queue = show.queue || [];
    queue.push({ singer: item.singer, song: item.song });
    show.queue = queue;

    const savedShow = await this.showRepository.save(show);

    // Notify clients of queue change
    this.chatGateway.server.to(showId).emit("queueUpdated", {
      showId,
      queue: savedShow.queue,
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
    } else {
      // No next performer - clear current performer
      show.currentSingerId = null;
      show.currentSong = null;
    }

    show.queue = queue;
    await this.showRepository.save(show);

    // Notify clients
    this.chatGateway.server.to(showId).emit("queueUpdated", {
      showId,
      queue: show.queue,
    });

    // Always emit currentPerformerChanged - either with new performer or cleared (null)
    this.chatGateway.server.to(showId).emit("currentPerformerChanged", {
      showId,
      singer: next?.singer || null,
      song: next?.song || null,
    });

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

    // Check if a rating already exists for this user, performer, song, and show
    const existingRating = await this.ratingRepository.findOne({
      where: {
        userId: user.id,
        performerId: performer.id,
        songTitle: rateDto.song,
        showId: parseInt(rateDto.showId),
      },
    });

    let savedRating: Rating;

    if (existingRating) {
      // Prevent rating updates - user can only rate once per performance
      throw new Error(
        `You have already rated this performance. Ratings cannot be updated.`
      );
    } else {
      // Create a new rating
      const rating = this.ratingRepository.create({
        score: rateDto.rating,
        comment: rateDto.comment || "",
        songTitle: rateDto.song,
        userId: user.id,
        performerId: performer.id,
        showId: parseInt(rateDto.showId),
      });
      savedRating = await this.ratingRepository.save(rating);
    }

    // Check if all participants have rated the current performer
    const show = await this.showRepository.findOne({
      where: { id: parseInt(rateDto.showId) },
    });

    if (show && show.currentSingerId) {
      // Get all participants in the show (excluding the current performer)
      const participantCount =
        show.participants?.filter(
          (participantId) => participantId !== show.currentSingerId
        ).length || 0;

      if (participantCount > 0) {
        // Count how many participants have rated this specific performance
        const currentPerformerName = await this.getUsernameById(
          show.currentSingerId
        );
        const ratingsForCurrentPerformance = await this.ratingRepository.count({
          where: {
            showId: parseInt(rateDto.showId),
            performerId: show.currentSingerId,
            songTitle: show.currentSong,
          },
        });

        // If all participants (except performer) have rated, auto-advance
        if (ratingsForCurrentPerformance >= participantCount) {
          console.log(
            `All participants have rated ${currentPerformerName}. Auto-advancing...`
          );
          await this.advanceQueue(rateDto.showId);
        }
      }
    }

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

  async reorderQueue(
    showId: string,
    newQueue: QueueItem[],
    singerOrder?: string[]
  ): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(showId) },
    });

    if (!show) return undefined;

    // Persist singer order if provided
    if (singerOrder && Array.isArray(singerOrder)) {
      show.singerOrder = singerOrder;
    }

    // Always sort queue by singerOrder if present
    let sortedQueue = newQueue;
    if (show.singerOrder && show.singerOrder.length) {
      const rank = new Map<string, number>(
        show.singerOrder.map((s, i) => [s, i])
      );
      sortedQueue = newQueue
        .map((item, idx) => ({ item, idx }))
        .sort((a, b) => {
          const ra = rank.has(a.item.singer)
            ? (rank.get(a.item.singer) as number)
            : Number.MAX_SAFE_INTEGER;
          const rb = rank.has(b.item.singer)
            ? (rank.get(b.item.singer) as number)
            : Number.MAX_SAFE_INTEGER;
          if (ra !== rb) return ra - rb;
          return a.idx - b.idx;
        })
        .map((e) => e.item);
    }

    show.queue = sortedQueue;
    await this.showRepository.save(show);

    // Notify clients of the queue update
    this.chatGateway.server.to(showId).emit("queueUpdated", {
      showId,
      queue: show.queue,
      singerOrder: show.singerOrder,
    });

    return this.getShow(showId);
  }

  async invalidateAllShows(): Promise<{ affected: number }> {
    const result = await this.showRepository.update(
      { isValid: true }, // Only update currently valid shows
      { isValid: false }
    );
    return { affected: result.affected || 0 };
  }

  async updateKarafunUrl(
    showId: string,
    karafunUrl: string
  ): Promise<ShowInterface | undefined> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(showId), isValid: true },
    });

    if (!show) {
      return undefined;
    }

    // Only allow Karafun URL updates for Karafun venues
    if (show.venue !== "karafun") {
      throw new Error("Karafun URL can only be set for Karafun venues");
    }

    show.karafunUrl = karafunUrl;
    await this.showRepository.save(show);

    // Start or restart a persistent Karafun session for this show
    try {
      await this.karafunSessionManager.startPersistentSession(showId, karafunUrl);
    } catch (e) {
      console.error(`Failed to start persistent Karafun session for show ${showId}:`, e);
      // Non-fatal for updating the URL
    }

    return this.getShow(showId);
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

      // Stop any persistent Karafun session for this show
      try {
        await this.karafunSessionManager.stopSession(id);
      } catch (e) {
        console.warn(`Failed to stop Karafun session for deleted show ${id}:`, e);
      }

      // Delete associated ratings first (if any)
      if (show.ratings && show.ratings.length > 0) {
        await this.ratingRepository.delete({ showId: numericId });
      }

      // Delete the show
      await this.showRepository.delete(numericId);

      // Broadcast show deletion to all connected clients
      await this.chatGateway.broadcastShowDeleted(
        show.id.toString(),
        show.name
      );

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
      // Stop all Karafun sessions
      try {
        await this.karafunSessionManager.stopAllSessions();
      } catch (e) {
        console.warn("Failed to stop all Karafun sessions during deleteAllShows:", e);
      }

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

  async hasUserRatedCurrentPerformance(
    showId: string,
    username: string
  ): Promise<{ hasRated: boolean; performer?: string; song?: string }> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(showId) },
    });

    if (!show || !show.currentSingerId) {
      return { hasRated: false };
    }

    // Find the user by username
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      return { hasRated: false };
    }

    // Get current performer info
    const currentPerformer = await this.getUsernameById(show.currentSingerId);

    // Check if user has already rated this specific performance
    const existingRating = await this.ratingRepository.findOne({
      where: {
        userId: user.id,
        performerId: show.currentSingerId,
        songTitle: show.currentSong,
        showId: parseInt(showId),
      },
    });

    return {
      hasRated: !!existingRating,
      performer: currentPerformer,
      song: show.currentSong || undefined,
    };
  }

  async refreshKarafunQueue(showId: string): Promise<any> {
    const show = await this.showRepository.findOne({
      where: { id: parseInt(showId), isValid: true },
    });

    if (!show) {
      throw new Error("Show not found");
    }

    if (show.venue !== "karafun") {
      throw new Error(
        "Karafun queue refresh is only available for Karafun shows"
      );
    }

    if (!show.karafunUrl) {
      throw new Error("No Karafun URL set for this show");
    }

    console.log(
      `🔄 Force refreshing Karafun data for show ${showId} from ${show.karafunUrl}`
    );

    try {
      const karafunData = await this.karafunService.parseQueueFromUrl(
        show.karafunUrl
      );

      if (karafunData && (karafunData.singers || karafunData.songEntries)) {
        show.karafunCachedData = karafunData;
        show.karafunLastParsed = new Date();
        await this.showRepository.save(show);

        console.log(
          `💾 Cached refreshed Karafun data for show ${showId} with ${karafunData.singers?.length || 0} singers`
        );

        // Always broadcast the updated data to all clients in the show
        console.log(
          `📡 Broadcasting forced Karafun queue refresh to all clients in show ${showId}`
        );
        this.chatGateway.server
          .to(`show_${showId}`)
          .emit("karafunQueueUpdated", {
            showId: parseInt(showId),
            karafunData: karafunData,
          });

        return karafunData;
      } else {
        throw new Error("Parsed data was empty or invalid");
      }
    } catch (error) {
      console.error(`❌ Karafun refresh failed for show ${showId}:`, error);
      throw error;
    }
  }
}
