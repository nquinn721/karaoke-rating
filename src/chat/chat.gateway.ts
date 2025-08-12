import { Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Repository } from "typeorm";
import { FeedbackService } from "../feedback/feedback.service";
import { ShowsService } from "../shows/shows.service";
import { User } from "../user/entities/user.entity";
import { UserService } from "../user/user.service";
import { ChatMessage } from "./chat.interface";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => FeedbackService))
    private readonly feedbackService: FeedbackService,
    @Inject(forwardRef(() => ShowsService))
    private readonly showsService: ShowsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService
  ) {}

  private messages: ChatMessage[] = [];
  // Track participants per show: showId -> (socketId -> username)
  private participantsByShow: Map<string, Map<string, string>> = new Map();
  // Track username and showId per socket for admin view
  private socketMeta: Map<
    string,
    {
      username?: string;
      showId?: string;
      userId?: number;
      connectedAt: Date;
      user?: any;
    }
  > = new Map();

  async handleConnection(client: Socket) {
    // Initialize socket metadata
    this.socketMeta.set(client.id, {
      connectedAt: new Date(),
      username: undefined,
      showId: undefined,
      userId: undefined,
      user: undefined,
    });

    // Emit updated active users to admin
    this.emitAdminActiveUsers();
  }

  @SubscribeMessage("authenticate")
  async handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token: string }
  ) {
    try {
      if (!data.token) {
        client.emit("authError", { message: "Token is required" });
        return;
      }

      // Verify token and get user
      const user = await this.userService.verifyToken(data.token);
      if (!user) {
        client.emit("authError", { message: "Invalid token" });
        return;
      }

      // Set user as logged in
      await this.userService.setUserLoggedIn(user.id, true);

      // Store user object on socket instance
      (client as any).user = user;

      // Update socket metadata
      const meta = this.socketMeta.get(client.id) || {
        connectedAt: new Date(),
      };
      this.socketMeta.set(client.id, {
        ...meta,
        username: user.username,
        userId: user.id,
        user: user,
      });

      console.log(
        `User authenticated: ${user.username} (${user.id}) on socket ${client.id}`
      );

      // Emit success
      client.emit("authSuccess", {
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
          isLoggedIn: true,
        },
      });

      // Emit updated active users to admin
      this.emitAdminActiveUsers();
    } catch (error) {
      console.error("Authentication error:", error);
      client.emit("authError", { message: "Authentication failed" });
    }
  }

  private getParticipants(showId: string): string[] {
    const map = this.participantsByShow.get(showId);
    return map ? Array.from(map.values()) : [];
  }

  private addParticipant(
    showId: string,
    socketId: string,
    username: string,
    userId?: number
  ) {
    let map = this.participantsByShow.get(showId);
    if (!map) {
      map = new Map();
      this.participantsByShow.set(showId, map);
    }
    map.set(socketId, username);
    // update meta
    const meta = this.socketMeta.get(socketId) || { connectedAt: new Date() };
    this.socketMeta.set(socketId, { ...meta, username, showId, userId });
  }

  private removeParticipant(showId: string, socketId: string) {
    const map = this.participantsByShow.get(showId);
    if (!map) return;
    map.delete(socketId);
    if (map.size === 0) this.participantsByShow.delete(showId);
    // clear showId if no longer in this show
    const meta = this.socketMeta.get(socketId) || { connectedAt: new Date() };
    if (meta.showId === showId)
      this.socketMeta.set(socketId, { ...meta, showId: undefined });
  }

  private async removeParticipantFromAll(client: Socket) {
    for (const [showId, map] of this.participantsByShow.entries()) {
      if (map.has(client.id)) {
        map.delete(client.id);
        if (map.size === 0) this.participantsByShow.delete(showId);

        // Update database if user has an ID
        const meta = this.socketMeta.get(client.id);
        if (meta?.userId) {
          try {
            await this.showsService.leaveShow({
              showId: showId,
              userId: meta.userId,
            });
          } catch (error) {
            console.error("Failed to update database on disconnect:", error);
          }
        }

        // Broadcast globally so HomePage sees all counts
        this.server.emit("participantsUpdated", {
          showId,
          participants: this.getParticipants(showId),
        });
      }
    }
    // remove meta
    this.socketMeta.delete(client.id);
    this.emitAdminActiveUsers();
  }

  private async handleLeaveRoom(showId: string, socketId: string) {
    const meta = this.socketMeta.get(socketId);
    this.removeParticipant(showId, socketId);

    // Update socket metadata to clear showId if leaving current show
    if (meta?.showId === showId) {
      this.socketMeta.set(socketId, { ...meta, showId: undefined });
    }

    // Update database if user has an ID and is leaving this specific show
    if (meta?.userId && meta.showId === showId) {
      try {
        await this.showsService.leaveShow({
          showId: showId,
          userId: meta.userId,
        });
      } catch (error) {
        console.error("Failed to update database on leave:", error);
      }
    }
  }

  private async emitAdminActiveUsers() {
    try {
      // Only get metadata for actually connected sockets
      const connectedSocketIds = new Set(
        Array.from(this.server.sockets.sockets.keys())
      );

      // Filter socketMeta to only include connected sockets
      const validSocketMeta = Array.from(this.socketMeta.entries()).filter(
        ([socketId]) => connectedSocketIds.has(socketId)
      );

      // Clean up metadata for disconnected sockets
      for (const [socketId] of this.socketMeta.entries()) {
        if (!connectedSocketIds.has(socketId)) {
          this.socketMeta.delete(socketId);
        }
      }

      // Get enhanced user data from valid socket metadata
      const userPromises = validSocketMeta.map(async ([socketId, meta]) => {
        let user = meta.user;

        // If we don't have user data cached and have userId, fetch it
        if (!user && meta.userId) {
          try {
            user = await this.userRepository.findOne({
              where: { id: meta.userId },
            });
            // Cache the user data
            meta.user = user;
          } catch (error) {
            console.error("Error fetching user:", error);
          }
        }

        return {
          socketId,
          username:
            meta.username ||
            user?.username ||
            `Guest-${socketId.substring(0, 6)}`,
          showId: meta.showId,
          userId: meta.userId,
          user: user
            ? {
                id: user.id,
                username: user.username,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt,
              }
            : null,
          connectedAt: meta.connectedAt,
          isAdmin: user?.isAdmin || false,
          lastActivity: meta.connectedAt,
        };
      });

      const users = await Promise.all(userPromises);
      this.server.emit("adminActiveUsers", users);
    } catch (error) {
      console.error("Error emitting admin active users:", error);
      // Basic fallback with connected sockets only
      const connectedSocketIds = new Set(
        Array.from(this.server.sockets.sockets.keys())
      );
      const users = Array.from(this.socketMeta.entries())
        .filter(([socketId]) => connectedSocketIds.has(socketId))
        .map(([socketId, meta]) => ({
          socketId,
          username: meta.username || `Guest-${socketId.substring(0, 6)}`,
          showId: meta.showId,
          userId: meta.userId,
          connectedAt: meta.connectedAt,
          isAdmin: false,
          lastActivity: meta.connectedAt,
        }));
      this.server.emit("adminActiveUsers", users);
    }
  }

  @SubscribeMessage("adminSubscribe")
  async handleAdminSubscribe(@ConnectedSocket() client: Socket) {
    // Send current active users to this admin client
    const users = Array.from(this.socketMeta.entries()).map(
      ([socketId, meta]) => ({
        socketId,
        username: meta.username || "",
        showId: meta.showId,
      })
    );
    client.emit("adminActiveUsers", users);

    // Send all feedback as initial payload
    try {
      const all = await this.feedbackService.getAllFeedback();
      client.emit("adminFeedbackAll", all);
    } catch (e) {
      // ignore
      client.emit("adminFeedbackAll", []);
    }
  }

  @SubscribeMessage("joinShow")
  async handleJoinShow(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string; username?: string; userId?: number }
  ): Promise<void> {
    console.log(`[DEBUG] Client ${client.id} joining show ${data.showId}`);

    // Leave all other joined rooms (auto-leave previous show)
    for (const room of client.rooms) {
      if (room !== client.id && room !== data.showId) {
        console.log(`[DEBUG] Client ${client.id} leaving room ${room}`);
        client.leave(room);
        await this.handleLeaveRoom(room, client.id);
        // Broadcast globally so all clients update lists
        this.server.emit("participantsUpdated", {
          showId: room,
          participants: this.getParticipants(room),
        });
      }
    }

    // Join the new room and update participants
    client.join(data.showId);
    console.log(
      `[DEBUG] Client ${client.id} successfully joined room ${data.showId}`
    );

    // Ensure we have a proper username, prefer DB lookup when userId is provided
    let username = data.username?.trim();
    if ((!username || username.length === 0) && data.userId) {
      try {
        const user = await this.userRepository.findOne({
          where: { id: data.userId },
          select: ["username"],
        });
        username = user?.username || `User${data.userId}`;
      } catch {
        username = `User${data.userId}`;
      }
    }
    if (!username) username = "Unknown";

    this.addParticipant(data.showId, client.id, username, data.userId);

    // Update socket metadata
    const meta = this.socketMeta.get(client.id) || { connectedAt: new Date() };
    this.socketMeta.set(client.id, {
      ...meta,
      username,
      showId: data.showId,
      userId: data.userId,
    });

    // Update database if user has an ID
    if (data.userId) {
      try {
        await this.showsService.joinShow({
          showId: data.showId,
          userId: data.userId,
        });
      } catch (error) {
        console.error("Failed to update database on join:", error);
      }
    }

    client.emit("joinedShow", { showId: data.showId });

    // Send previous messages for this show
    const showMessages = this.messages.filter(
      (msg) => msg.showId === data.showId
    );
    client.emit("previousMessages", showMessages);

    // Broadcast participants update globally (not just the room)
    this.server.emit("participantsUpdated", {
      showId: data.showId,
      participants: this.getParticipants(data.showId),
    });

    // Emit admin users
    this.emitAdminActiveUsers();
  }

  @SubscribeMessage("sendMessage")
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string; username: string; message: string }
  ): void {
    const chatMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      showId: data.showId,
      username: data.username,
      message: data.message,
      timestamp: new Date(),
    };

    this.messages.push(chatMessage);
    this.server.to(data.showId).emit("newMessage", chatMessage);
  }

  @SubscribeMessage("leaveShow")
  async handleLeaveShow(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string; userId?: number }
  ): Promise<void> {
    client.leave(data.showId);
    await this.handleLeaveRoom(data.showId, client.id);
    client.emit("leftShow", { showId: data.showId });

    // Broadcast participants update globally
    this.server.emit("participantsUpdated", {
      showId: data.showId,
      participants: this.getParticipants(data.showId),
    });

    // Emit admin users
    this.emitAdminActiveUsers();
  }

  @SubscribeMessage("currentPerformerUpdate")
  handleCurrentPerformerUpdate(
    @MessageBody() data: { showId: string; singer: string; song: string }
  ): void {
    this.server.to(data.showId).emit("currentPerformerChanged", {
      singer: data.singer,
      song: data.song,
    });
  }

  async handleDisconnect(client: Socket) {
    // Get user from socket metadata before cleanup
    const meta = this.socketMeta.get(client.id);
    const user = (client as any).user || meta?.user;

    // Set user as logged out if they were authenticated
    if (user && user.id) {
      try {
        await this.userService.setUserLoggedIn(user.id, false);
        console.log(`User logged out: ${user.username} (${user.id})`);
      } catch (error) {
        console.error("Error setting user logged out:", error);
      }
    }

    // Remove from all shows and clean up metadata
    await this.removeParticipantFromAll(client);

    // Remove socket metadata
    this.socketMeta.delete(client.id);

    // Emit updated active users to admin
    this.emitAdminActiveUsers();
  }

  @SubscribeMessage("updateUsername")
  async handleUpdateUsername(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { username: string }
  ) {
    // Update socket metadata
    const currentMeta = this.socketMeta.get(client.id) || {
      connectedAt: new Date(),
    };
    this.socketMeta.set(client.id, { ...currentMeta, username: data.username });

    // Update username for this socket across all joined shows
    for (const [showId, map] of this.participantsByShow.entries()) {
      if (map.has(client.id)) {
        map.set(client.id, data.username);
        // update meta
        const meta = this.socketMeta.get(client.id) || {
          connectedAt: new Date(),
        };
        this.socketMeta.set(client.id, { ...meta, username: data.username });
        // Broadcast updated participants to everyone
        this.server.emit("participantsUpdated", {
          showId,
          participants: this.getParticipants(showId),
        });
      }
    }
    // emit admin view update
    this.emitAdminActiveUsers();
    client.emit("usernameUpdated", { username: data.username });
  }

  // Broadcast show deletion to all connected clients
  broadcastShowDeleted(showId: string, showName: string) {
    // Remove participants from the deleted show
    if (this.participantsByShow.has(showId)) {
      this.participantsByShow.delete(showId);
    }

    // Clear showId from socket metadata for users in deleted show
    for (const [socketId, meta] of this.socketMeta.entries()) {
      if (meta.showId === showId) {
        this.socketMeta.set(socketId, { ...meta, showId: undefined });
      }
    }

    // Broadcast to all connected clients
    this.server.emit("showDeleted", {
      showId,
      showName,
      message: `Show "${showName}" has been deleted`,
    });

    // Update admin view
    this.emitAdminActiveUsers();
  }
}
