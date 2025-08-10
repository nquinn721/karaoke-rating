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
  // live queue per show from websocket updates
  queueByShow = observable.map<string, { singer: string; song: string }[]>([]);
  // live current performer per show
  currentPerformerByShow = observable.map<
    string,
    { singer?: string; song?: string }
  >([]);

  constructor(baseAPI: BaseAPIStore) {
    makeAutoObservable(this);
    this.baseAPI = baseAPI;
  }

  initializeSocket() {
    if (this.socket) return;

    // Use the same base URL logic as the API
    const socketURL = this.baseAPI.currentBaseURL;
    const token = localStorage.getItem("auth_token");
    this.socket = io(socketURL, {
      auth: token ? { token } : undefined,
    });

    this.socket.on("connect", () => {
      runInAction(() => {
        this.connected = true;
      });

      // Authenticate with server if we have a token
      const authToken = localStorage.getItem("auth_token");
      if (authToken) {
        this.socket?.emit("authenticate", { token: authToken });
      }
    });

    this.socket.on("disconnect", () => {
      runInAction(() => {
        this.connected = false;
        this.currentShowId = null;
      });
    });

    // Handle authentication success
    this.socket.on("authSuccess", (data: { user: any }) => {
      console.log("Socket authentication successful:", data.user);
      // User is now authenticated on the socket connection
    });

    // Handle authentication error
    this.socket.on("authError", (data: { message: string }) => {
      console.error("Socket authentication failed:", data.message);
      // Could trigger re-authentication or logout
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

    // Receive live queue updates
    this.socket.on(
      "queueUpdated",
      ({
        showId,
        queue,
      }: {
        showId: string;
        queue: { singer: string; song: string }[];
      }) => {
        runInAction(() => {
          this.queueByShow.set(showId, Array.isArray(queue) ? queue : []);
        });
      }
    );

    // Receive current performer changes
    this.socket.on(
      "currentPerformerChanged",
      ({
        showId,
        singer,
        song,
      }: {
        showId: string;
        singer?: string;
        song?: string;
      }) => {
        runInAction(() => {
          this.currentPerformerByShow.set(showId, { singer, song });
        });
      }
    );
  }

  joinShow(showId: string, username: string) {
    if (!this.socket) return;

    const userJson = localStorage.getItem("user_data");
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?.id;

    this.socket.emit(
      "joinShow",
      userId ? { showId, userId } : { showId, username }
    );
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

    const userJson = localStorage.getItem("user_data");
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?.id;

    this.socket.emit("leaveShow", userId ? { showId, userId } : { showId });
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
      this.queueByShow.clear();
      this.currentPerformerByShow.clear();
    }
  }

  // Method to authenticate after login
  authenticateSocket() {
    const token = localStorage.getItem("auth_token");
    if (this.socket && this.connected && token) {
      this.socket.emit("authenticate", { token });
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
