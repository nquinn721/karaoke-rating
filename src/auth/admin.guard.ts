import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Simple admin check - in a real app, you'd check JWT token or session
    // For now, we'll check for a simple admin header or query parameter
    const adminKey = request.headers["x-admin-key"] || request.query.adminKey;

    // Use environment variable for admin key, fallback to development key
    const validAdminKey = process.env.ADMIN_KEY || "karaoke-admin-2024";

    if (!adminKey || adminKey !== validAdminKey) {
      throw new UnauthorizedException("Admin access required");
    }

    return true;
  }
}
