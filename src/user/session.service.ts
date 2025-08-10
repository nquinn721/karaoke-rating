import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserSession } from "./entities/user-session.entity";
import { User } from "./entities/user.entity";

export interface SessionData {
  socketId: string;
  userId?: number;
  username?: string;
  showId?: string;
  metadata?: any;
}

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async createSession(sessionData: SessionData): Promise<UserSession> {
    // Remove any existing session with this socketId
    await this.sessionRepository.delete({ socketId: sessionData.socketId });

    const session = this.sessionRepository.create({
      socketId: sessionData.socketId,
      userId: sessionData.userId,
      username: sessionData.username,
      showId: sessionData.showId,
      metadata: sessionData.metadata,
      isActive: true,
      lastActivity: new Date(),
    });

    return await this.sessionRepository.save(session);
  }

  async updateSession(
    socketId: string,
    updates: Partial<SessionData>
  ): Promise<UserSession | null> {
    const session = await this.sessionRepository.findOne({
      where: { socketId, isActive: true },
    });

    if (!session) {
      return null;
    }

    Object.assign(session, updates);
    session.lastActivity = new Date();

    // If userId is provided, load the user relationship
    if (updates.userId) {
      const user = await this.userRepository.findOne({
        where: { id: updates.userId },
      });
      session.user = user;
    }

    return await this.sessionRepository.save(session);
  }

  async removeSession(socketId: string): Promise<void> {
    await this.sessionRepository.update(
      { socketId, isActive: true },
      { isActive: false, lastActivity: new Date() }
    );
  }

  async getActiveSessions(): Promise<UserSession[]> {
    return await this.sessionRepository.find({
      where: { isActive: true },
      relations: ["user"],
      order: { connectedAt: "DESC" },
    });
  }

  async getActiveSessionsWithShow(): Promise<
    Array<{
      socketId: string;
      username: string;
      showId: string | null;
      userId: number | null;
      connectedAt: Date;
      lastActivity: Date;
      isAdmin: boolean;
    }>
  > {
    const sessions = await this.sessionRepository
      .createQueryBuilder("session")
      .leftJoinAndSelect("session.user", "user")
      .where("session.isActive = :isActive", { isActive: true })
      .orderBy("session.connectedAt", "DESC")
      .getMany();

    return sessions.map((session) => ({
      socketId: session.socketId,
      username:
        session.user?.username ||
        session.username ||
        `Guest-${session.socketId.substring(0, 6)}`,
      showId: session.showId,
      userId: session.userId,
      connectedAt: session.connectedAt,
      lastActivity: session.lastActivity,
      isAdmin: session.user?.isAdmin || false,
    }));
  }

  async updateSessionShow(
    socketId: string,
    showId: string | null
  ): Promise<void> {
    await this.sessionRepository.update(
      { socketId, isActive: true },
      { showId, lastActivity: new Date() }
    );
  }

  async associateSessionWithUser(
    socketId: string,
    userId: number
  ): Promise<void> {
    await this.sessionRepository.update(
      { socketId, isActive: true },
      { userId, lastActivity: new Date() }
    );
  }

  async cleanupInactiveSessions(olderThanMinutes: number = 30): Promise<void> {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    await this.sessionRepository.update(
      {
        isActive: true,
        lastActivity: { $lt: cutoffTime } as any,
      },
      { isActive: false }
    );
  }
}
