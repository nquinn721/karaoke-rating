import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { AuthService } from "../auth/auth.service";

export interface LoginResponse {
  success: boolean;
  user: {
    id: number;
    username: string;
    createdAt: Date;
  };
  authToken: string;
  isNewUser: boolean;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService,
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
    const authToken = this.authService.generateAuthToken(user.id || 0, username);
    
    // Update user with new token
    user.authToken = authToken;
    user = await this.userRepository.save(user);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
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
}
