import { makeAutoObservable, observable, runInAction } from "mobx";
import { io, Socket } from "socket.io-client";
import { BaseAPIStore } from "./BaseAPIStore";
import { ChatMessage, Show } from "./types";

export class ChatStore {
  messages: ChatMessage[] = [];
  socket: Socket | null = null;
  connected: boolean = false;
  private baseAPI: BaseAPIStore;
  // track current show
  currentShowId: string | null = null;
  // participants per show from websocket updates (observable map)
  participantsByShow = observable.map<string, string[]>([]);
  // live shows list cache from socket broadcasts
  liveShows: Show[] = [];

  constructor(baseAPI: BaseAPIStore) {
    makeAutoObservable(this);
    this.baseAPI = baseAPI;
  }

  initializeSocket() {
    if (this.socket) return;

    // Use the same base URL logic as the API
    const socketURL = this.baseAPI.currentBaseURL;
    this.socket = io(socketURL);

    this.socket.on("connect", () => {
      runInAction(() => {
        this.connected = true;
      });
    });

    this.socket.on("disconnect", () => {
      runInAction(() => {
        this.connected = false;
        this.currentShowId = null;
      });
    });

    this.socket.on("newMessage", (message: ChatMessage) => {
      runInAction(() => {
        this.messages.push(message);
      });
    });

    this.socket.on("previousMessages", (messages: ChatMessage[]) => {
      runInAction(() => {
        this.messages = messages;
      });
    });

    this.socket.on("joinedShow", ({ showId }: { showId: string }) => {
      runInAction(() => {
        this.currentShowId = showId;
      });
    });

    this.socket.on(
      "participantsUpdated",
      ({
        showId,
        participants,
      }: {
        showId: string;
        participants: string[];
      }) => {
        runInAction(() => {
          this.participantsByShow.set(showId, participants);
        });
      }
    );

    this.socket.on("leftShow", ({ showId }: { showId: string }) => {
      runInAction(() => {
        if (this.currentShowId === showId) this.currentShowId = null;
      });
    });

    // Receive live shows list updates
    this.socket.on("showsUpdated", (shows: Show[]) => {
      runInAction(() => {
        this.liveShows = shows;
      });
    });
  }

  joinShow(showId: string, username: string) {
    if (!this.socket) return;

    this.socket.emit("joinShow", { showId, username });
  }

  updateUsername(username: string) {
    if (!this.socket) return;

    this.socket.emit("updateUsername", { username });
  }

  sendMessage(showId: string, username: string, message: string) {
    if (!this.socket) return;

    this.socket.emit("sendMessage", { showId, username, message });
  }

  leaveShow(showId: string) {
    if (!this.socket) return;

    this.socket.emit("leaveShow", { showId });
    this.clearMessages();
  }

  clearMessages() {
    this.messages = [];
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.currentShowId = null;
      this.participantsByShow.clear();
      this.liveShows = [];
    }
  }

  // Future API method to fetch chat history from backend
  async fetchChatHistory(showId: string) {
    try {
      const messages = await this.baseAPI.get<ChatMessage[]>(
        `/api/chat/${showId}/history`
      );
      runInAction(() => {
        this.messages = messages;
      });
      return messages;
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      return [];
    }
  }
}
