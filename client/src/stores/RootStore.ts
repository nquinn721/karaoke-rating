import { AuthStore } from "./AuthStore";
import { BaseAPIStore } from "./BaseAPIStore";
import { ChatStore } from "./ChatStore";
import { FeedbackStore } from "./FeedbackStore";
import { KarafunStore } from "./KarafunStore";
import { ShowsStore } from "./ShowsStore";
import { SnackbarStore } from "./SnackbarStore";
import { UserStore } from "./UserStore";

export class RootStore {
  baseAPI = new BaseAPIStore();
  snackbarStore = new SnackbarStore();
  chatStore = new ChatStore(this.baseAPI, this);
  authStore = new AuthStore(this.chatStore);
  userStore = new UserStore(this);
  showsStore = new ShowsStore(this.baseAPI, this);
  feedbackStore = new FeedbackStore();
  karafunStore = new KarafunStore(this.baseAPI);

  constructor() {
    // Ensure socket is ready for live participants
    this.chatStore.initializeSocket();
  }
}

export const rootStore = new RootStore();

// No longer need to persist user store since we use AuthStore with server data
