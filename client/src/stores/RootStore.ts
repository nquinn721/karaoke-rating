import { create } from "mobx-persist";
import { BaseAPIStore } from "./BaseAPIStore";
import { ChatStore } from "./ChatStore";
import { ShowsStore } from "./ShowsStore";
import { UserStore } from "./UserStore";

export class RootStore {
  baseAPI = new BaseAPIStore();
  userStore = new UserStore();
  showsStore = new ShowsStore(this.baseAPI);
  chatStore = new ChatStore(this.baseAPI);

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

const hydrate = create({
  storage: localStorage,
  jsonify: true,
});

export const rootStore = new RootStore();

console.log("Global rootStore created:", {
  rootStore: !!rootStore,
  showsStore: !!rootStore.showsStore,
  shows: rootStore.showsStore?.shows,
});

// Persist user store
hydrate("user", rootStore.userStore).then(() => {
  console.log("UserStore hydrated");
});
