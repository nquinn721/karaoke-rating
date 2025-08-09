import { makeAutoObservable } from "mobx";
import { RootStore } from "./RootStore";

export class UserStore {
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  get username(): string {
    return this.rootStore.authStore.user?.username || "";
  }

  get user() {
    return this.rootStore.authStore.user;
  }

  get hasUsername() {
    return !!this.username.trim();
  }

  get isAuthenticated() {
    return this.rootStore.authStore.isAuthenticated;
  }

  get isAdmin() {
    return this.rootStore.authStore.user?.isAdmin || false;
  }

  // Legacy method for compatibility - now uses AuthStore
  setUsername(_username: string) {
    // This method is now handled by AuthStore.login()
    console.warn(
      "UserStore.setUsername is deprecated. Use AuthStore.login() instead."
    );
  }

  // Legacy method for compatibility - now uses AuthStore
  clearUsername() {
    this.rootStore.authStore.logout();
  }
}
