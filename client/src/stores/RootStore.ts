import { BaseAPIStore } from "./BaseAPIStore";
import { ChatStore } from "./ChatStore";
import { FeedbackStore } from "./FeedbackStore";
import { ShowsStore } from "./ShowsStore";
import { UserStore } from "./UserStore";
import { AuthStore } from "./AuthStore";

export class RootStore {
  baseAPI = new BaseAPIStore();
  authStore = new AuthStore();
  userStore = new UserStore(this);
  showsStore = new ShowsStore(this.baseAPI);
  chatStore = new ChatStore(this.baseAPI);
  feedbackStore = new FeedbackStore();

  constructor() {
    console.log("RootStore initialized", {
      baseAPI: !!this.baseAPI,
      showsStore: !!this.showsStore,
      showsArray: this.showsStore.shows,
    });

    // Ensure socket is ready for live participants
    this.chatStore.initializeSocket();
  }
}

export const rootStore = new RootStore();

console.log("Global rootStore created:", {
  rootStore: !!rootStore,
  showsStore: !!rootStore.showsStore,
  shows: rootStore.showsStore?.shows,
});

// No longer need to persist user store since we use AuthStore with server data
