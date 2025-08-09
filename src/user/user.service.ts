import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { Rating } from "../rating/entities/rating.entity";
import { Show } from "../shows/entities/show.entity";
import { User } from "./entities/user.entity";

export interface LoginResponse {
  success: boolean;
  user: {
    id: number;
    username: string;
    createdAt: Date;
    isAdmin: boolean;
  };
  authToken: string;
  isNewUser: boolean;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Rating)
    private ratingRepository: Repository<Rating>,
    @InjectRepository(Show)
    private showRepository: Repository<Show>,
    private authService: AuthService
  ) {}

  async loginOrRegister(username: string): Promise<LoginResponse> {
    let user = await this.userRepository.findOne({
      where: { username },
      relations: ["ratings"],
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      user = this.userRepository.create({ username });
      isNewUser = true;
    }

    // Generate new auth token
    const authToken = this.authService.generateAuthToken(
      user.id || 0,
      username
    );

    // Update user with new token
    user.authToken = authToken;
    user = await this.userRepository.save(user);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin,
      },
      authToken,
      isNewUser,
    };
  }

  async verifyToken(token: string): Promise<User | null> {
    const payload = this.authService.verifyToken(token);
    if (!payload) return null;

    const user = await this.userRepository.findOne({
      where: { id: payload.userId, authToken: token },
      relations: ["ratings"],
    });

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ["ratings"],
    });
  }

  async changeUsername(
    oldUsername: string,
    newUsername: string
  ): Promise<{ success: boolean; message: string; user?: any }> {
    // Check if old user exists
    let oldUser = await this.userRepository.findOne({
      where: { username: oldUsername },
      relations: ["ratings"],
    });

    // If old user doesn't exist, create them first (treat as initial registration)
    if (!oldUser) {
      oldUser = this.userRepository.create({
        username: oldUsername,
        authToken: this.authService.generateAuthToken(null, oldUsername),
        isAdmin: false,
      });
      oldUser = await this.userRepository.save(oldUser);

      // Update the auth token with the actual user ID
      oldUser.authToken = this.authService.generateAuthToken(
        oldUser.id,
        oldUsername
      );
      oldUser = await this.userRepository.save(oldUser);
    }

    // Check if new username already exists
    const existingUser = await this.userRepository.findOne({
      where: { username: newUsername },
    });

    if (existingUser && existingUser.id !== oldUser.id) {
      return { success: false, message: "Username already taken" };
    }

    // If new username is the same as old username, just return the user
    if (oldUsername === newUsername) {
      return {
        success: true,
        message: "Username verified",
        user: {
          id: oldUser.id,
          username: oldUser.username,
          createdAt: oldUser.createdAt,
          isAdmin: oldUser.isAdmin,
          authToken: oldUser.authToken,
        },
      };
    }

    // Update username
    oldUser.username = newUsername;

    // Generate new auth token for security
    const authToken = this.authService.generateAuthToken(
      oldUser.id,
      newUsername
    );
    oldUser.authToken = authToken;

    const updatedUser = await this.userRepository.save(oldUser);

    return {
      success: true,
      message: "Username changed successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        createdAt: updatedUser.createdAt,
        isAdmin: updatedUser.isAdmin,
        authToken,
      },
    };
  }

  async findOrCreateUser(username: string): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { username },
      relations: ["ratings"],
    });

    if (!user) {
      user = this.userRepository.create({ username });
      user = await this.userRepository.save(user);
    }

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      relations: ["ratings"],
      order: { createdAt: "DESC" },
    });
  }

  async getUserHistory(userId: number) {
    // Get all shows where user was a participant (stored as JSON array of user IDs in participants column)
    const showsAttended = await this.showRepository
      .createQueryBuilder("show")
      .where("JSON_CONTAINS(show.participants, :userId)", {
        userId: JSON.stringify(userId),
      })
      .orderBy("show.createdAt", "DESC")
      .getMany();

    // Get all ratings given by the user
    const ratingsGiven = await this.ratingRepository.find({
      where: { userId },
      relations: ["performer", "show"],
      order: { createdAt: "DESC" },
    });

    // Get all ratings received by the user
    const ratingsReceived = await this.ratingRepository.find({
      where: { performerId: userId },
      relations: ["user", "show"],
      order: { createdAt: "DESC" },
    });

    return {
      showsAttended: showsAttended.map((show) => ({
        id: show.id,
        name: show.name,
        venue: show.venue,
        createdAt: show.createdAt,
        participants: show.participants,
        currentSingerId: show.currentSingerId,
        currentSong: show.currentSong,
      })),
      ratingsGiven: ratingsGiven.map((rating) => ({
        id: rating.id,
        score: rating.score,
        comment: rating.comment,
        songTitle: rating.songTitle,
        createdAt: rating.createdAt,
        performer: {
          id: rating.performer.id,
          username: rating.performer.username,
        },
        show: {
          id: rating.show.id,
          name: rating.show.name,
          venue: rating.show.venue,
          createdAt: rating.show.createdAt,
        },
      })),
      ratingsReceived: ratingsReceived.map((rating) => ({
        id: rating.id,
        score: rating.score,
        comment: rating.comment,
        songTitle: rating.songTitle,
        createdAt: rating.createdAt,
        rater: {
          id: rating.user.id,
          username: rating.user.username,
        },
        show: {
          id: rating.show.id,
          name: rating.show.name,
          venue: rating.show.venue,
          createdAt: rating.show.createdAt,
        },
      })),
      stats: {
        totalShowsAttended: showsAttended.length,
        totalRatingsGiven: ratingsGiven.length,
        totalRatingsReceived: ratingsReceived.length,
        averageRatingGiven:
          ratingsGiven.length > 0
            ? ratingsGiven.reduce((sum, r) => sum + Number(r.score), 0) /
              ratingsGiven.length
            : 0,
        averageRatingReceived:
          ratingsReceived.length > 0
            ? ratingsReceived.reduce((sum, r) => sum + Number(r.score), 0) /
              ratingsReceived.length
            : 0,
      },
    };
  }
}
