import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { UserService } from "../user/user.service";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Authorization token required");
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    
    // Verify token and get user
    const user = await this.userService.verifyToken(token);
    if (!user) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    // Check if user is admin
    if (!user.isAdmin) {
      throw new UnauthorizedException("Admin privileges required");
    }

    // Add user to request for potential use in controllers
    (request as any).user = user;

    return true;
  }
}
