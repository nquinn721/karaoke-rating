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

    // For development/internal admin interface, allow localhost requests
    const isLocalhost =
      request.hostname === "localhost" ||
      request.hostname === "127.0.0.1" ||
      request.ip === "::1" ||
      request.ip === "127.0.0.1";

    // If it's a localhost request, allow it (for admin interface)
    if (isLocalhost) {
      return true;
    }

    // For external requests, require admin key
    const adminKey = request.headers["x-admin-key"] || request.query.adminKey;
    const validAdminKey = process.env.ADMIN_KEY || "karaoke-admin-2024";

    if (!adminKey || adminKey !== validAdminKey) {
      throw new UnauthorizedException("Admin access required");
    }

    return true;
  }
}
