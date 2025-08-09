import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatMessage } from "./chat.interface";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private messages: ChatMessage[] = [];
  // Track participants per show: showId -> (socketId -> username)
  private participantsByShow: Map<string, Map<string, string>> = new Map();

  private getParticipants(showId: string): string[] {
    const map = this.participantsByShow.get(showId);
    return map ? Array.from(map.values()) : [];
  }

  private addParticipant(showId: string, socketId: string, username: string) {
    let map = this.participantsByShow.get(showId);
    if (!map) {
      map = new Map();
      this.participantsByShow.set(showId, map);
    }
    map.set(socketId, username);
  }

  private removeParticipant(showId: string, socketId: string) {
    const map = this.participantsByShow.get(showId);
    if (!map) return;
    map.delete(socketId);
    if (map.size === 0) this.participantsByShow.delete(showId);
  }

  private removeParticipantFromAll(client: Socket) {
    for (const [showId, map] of this.participantsByShow.entries()) {
      if (map.has(client.id)) {
        map.delete(client.id);
        if (map.size === 0) this.participantsByShow.delete(showId);
        // Broadcast globally so HomePage sees all counts
        this.server.emit("participantsUpdated", {
          showId,
          participants: this.getParticipants(showId),
        });
      }
    }
  }

  @SubscribeMessage("joinShow")
  handleJoinShow(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string; username: string }
  ): void {
    // Leave all other joined rooms (auto-leave previous show)
    for (const room of client.rooms) {
      if (room !== client.id && room !== data.showId) {
        client.leave(room);
        this.removeParticipant(room, client.id);
        // Broadcast globally so all clients update lists
        this.server.emit("participantsUpdated", {
          showId: room,
          participants: this.getParticipants(room),
        });
      }
    }

    // Join the new room and update participants
    client.join(data.showId);
    this.addParticipant(data.showId, client.id, data.username);

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
  handleLeaveShow(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string }
  ): void {
    client.leave(data.showId);
    this.removeParticipant(data.showId, client.id);
    client.emit("leftShow", { showId: data.showId });

    // Broadcast participants update globally
    this.server.emit("participantsUpdated", {
      showId: data.showId,
      participants: this.getParticipants(data.showId),
    });
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

  handleDisconnect(client: Socket) {
    this.removeParticipantFromAll(client);
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
        // Broadcast updated participants to everyone
        this.server.emit("participantsUpdated", {
          showId,
          participants: this.getParticipants(showId),
        });
      }
    }
    client.emit("usernameUpdated", { username: data.username });
  }
}
