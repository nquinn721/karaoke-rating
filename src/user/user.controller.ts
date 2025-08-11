import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { UserService } from "./user.service";

@Controller("api/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("login")
  async login(@Body() body: { username: string }) {
    if (!body.username || body.username.trim().length === 0) {
      return { success: false, message: "Username is required" };
    }

    const loginResponse = await this.userService.loginOrRegister(
      body.username.trim()
    );
    return loginResponse;
  }

  @Post("verify")
  async verifyToken(@Headers("authorization") authHeader: string) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { success: false, message: "Invalid authorization header" };
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    const user = await this.userService.verifyToken(token);

    if (!user) {
      return { success: false, message: "Invalid or expired token" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin,
      },
    };
  }

  @Get(":username")
  async getUser(@Param("username") username: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    return { success: true, user };
  }

  @Put("change-username")
  async changeUsername(
    @Body() body: { oldUsername: string; newUsername: string }
  ) {
    if (!body.oldUsername || !body.newUsername) {
      return {
        success: false,
        message: "Both oldUsername and newUsername are required",
      };
    }

    if (body.oldUsername.trim() === body.newUsername.trim()) {
      return {
        success: false,
        message: "New username must be different from current username",
      };
    }

    const result = await this.userService.changeUsername(
      body.oldUsername.trim(),
      body.newUsername.trim()
    );
    return result;
  }

  @Get()
  async getAllUsers() {
    const users = await this.userService.getAllUsers();
    return { success: true, users };
  }

  @Get(":username/history")
  async getUserHistory(@Param("username") username: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const history = await this.userService.getUserHistory(user.id);
    return { success: true, history };
  }

  @Put("update-karafun-name")
  async updateKarafunName(
    @Body() body: { username: string; karafunName: string }
  ) {
    if (!body.username || body.username.trim().length === 0) {
      return { success: false, message: "Username is required" };
    }

    if (!body.karafunName || body.karafunName.trim().length === 0) {
      return { success: false, message: "Karafun name is required" };
    }

    const result = await this.userService.updateKarafunName(
      body.username.trim(),
      body.karafunName.trim()
    );
    return result;
  }

  @Get(":username/karafun-name")
  async getUserKarafunName(@Param("username") username: string) {
    const karafunName = await this.userService.getUserKarafunName(username);
    return { success: true, karafunName };
  }
}
