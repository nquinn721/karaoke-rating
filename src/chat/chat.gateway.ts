import { Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ConnectedSocket,
  MessageBody,
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
import { ChatMessage } from "./chat.interface";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => FeedbackService))
    private readonly feedbackService: FeedbackService,
    @Inject(forwardRef(() => ShowsService))
    private readonly showsService: ShowsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  private messages: ChatMessage[] = [];
  // Track participants per show: showId -> (socketId -> username)
  private participantsByShow: Map<string, Map<string, string>> = new Map();
  // Track username and showId per socket for admin view
  private socketMeta: Map<
    string,
    { username?: string; showId?: string; userId?: number }
  > = new Map();

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
    const meta = this.socketMeta.get(socketId) || {};
    this.socketMeta.set(socketId, { ...meta, username, showId, userId });
  }

  private removeParticipant(showId: string, socketId: string) {
    const map = this.participantsByShow.get(showId);
    if (!map) return;
    map.delete(socketId);
    if (map.size === 0) this.participantsByShow.delete(showId);
    // clear showId if no longer in this show
    const meta = this.socketMeta.get(socketId) || {};
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

  private emitAdminActiveUsers() {
    const users = Array.from(this.socketMeta.entries()).map(
      ([socketId, meta]) => ({
        socketId,
        username: meta.username || "",
        showId: meta.showId,
      })
    );
    this.server.emit("adminActiveUsers", users);
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
    // Leave all other joined rooms (auto-leave previous show)
    for (const room of client.rooms) {
      if (room !== client.id && room !== data.showId) {
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
    await this.removeParticipantFromAll(client);
  }

  @SubscribeMessage("updateUsername")
  handleUpdateUsername(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { username: string }
  ) {
    // Update username for this socket across all joined shows
    for (const [showId, map] of this.participantsByShow.entries()) {
      if (map.has(client.id)) {
        map.set(client.id, data.username);
        // update meta
        const meta = this.socketMeta.get(client.id) || {};
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
}
