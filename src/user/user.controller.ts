import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  async login(@Body() body: { username: string }) {
    const user = await this.userService.findOrCreateUser(body.username);
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      }
    };
  }

  @Get(':username')
  async getUser(@Param('username') username: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    return { success: true, user };
  }

  @Get()
  async getAllUsers() {
    const users = await this.userService.getAllUsers();
    return { success: true, users };
  }
}
