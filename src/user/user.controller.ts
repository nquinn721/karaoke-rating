import { Body, Controller, Get, Param, Post, Headers } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller("api/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("login")
  async login(@Body() body: { username: string }) {
    if (!body.username || body.username.trim().length === 0) {
      return { success: false, message: "Username is required" };
    }
    
    const loginResponse = await this.userService.loginOrRegister(body.username.trim());
    return loginResponse;
  }

  @Post("verify")
  async verifyToken(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
      }
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

  @Get()
  async getAllUsers() {
    const users = await this.userService.getAllUsers();
    return { success: true, users };
  }
}
