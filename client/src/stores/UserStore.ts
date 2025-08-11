import { makeAutoObservable, runInAction } from "mobx";
import { RootStore } from "./RootStore";

export class UserStore {
  private rootStore: RootStore;
  karafunName: string | null = null;

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

  async updateKarafunName(karafunName: string): Promise<void> {
    if (!this.username) {
      throw new Error("User must be logged in to update Karafun name");
    }

    const response = await this.rootStore.baseAPI.put(
      "/api/users/update-karafun-name",
      {
        username: this.username,
        karafunName: karafunName.trim(),
      }
    );

    if (response.success) {
      runInAction(() => {
        this.karafunName = karafunName.trim();
      });
    } else {
      throw new Error(response.message || "Failed to update Karafun name");
    }
  }

  async fetchKarafunName(): Promise<void> {
    if (!this.username) {
      return;
    }

    try {
      const response = await this.rootStore.baseAPI.get(
        `/api/users/${this.username}/karafun-name`
      );
      if (response.success) {
        runInAction(() => {
          this.karafunName = response.karafunName;
        });
      }
    } catch (error) {
      console.error("Failed to fetch Karafun name:", error);
    }
  }

  get hasKarafunName(): boolean {
    return !!this.karafunName;
  }
}
