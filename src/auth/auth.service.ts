import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

export interface TokenPayload {
  userId: number;
  username: string;
  iat?: number;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  generateAuthToken(userId: number, username: string): string {
    const payload: TokenPayload = {
      userId,
      username,
    };
    
    // Generate a non-expiring JWT token
    return this.jwtService.sign(payload);
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      return null;
    }
  }

  generateSecureId(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
