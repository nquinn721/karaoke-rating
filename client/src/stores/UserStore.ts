import { makeAutoObservable } from "mobx";
import { persist } from "mobx-persist";

export class UserStore {
  @persist username: string = "";

  constructor() {
    makeAutoObservable(this);
  }

  setUsername(username: string) {
    this.username = username;
  }

  get hasUsername() {
    return !!this.username.trim();
  }

  clearUsername() {
    this.username = "";
  }
}
