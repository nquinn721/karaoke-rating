import { makeAutoObservable } from "mobx";

export interface User {
  id: number;
  username: string;
  createdAt: string;
  isAdmin: boolean;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  authToken: string;
  isNewUser: boolean;
}

export class AuthStore {
  user: User | null = null;
  authToken: string | null = null;
  isAuthenticated = false;
  isLoading = false;
  isInitializing = true; // Track initial load state

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  // Allow components to await initialization if needed
  async hydrate() {
    if (!this.isInitializing) return;
    // Wait a tick to allow loadFromStorage to finish if it's running
    await new Promise((r) => setTimeout(r, 0));
  }

  private async loadFromStorage() {
    this.isInitializing = true;
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");

    if (token && userData) {
      try {
        this.authToken = token;
        this.user = JSON.parse(userData);
        this.isAuthenticated = true;
        // Verify token is still valid in the background
        await this.verifyToken();
      } catch (error) {
        console.warn("Failed to load saved auth data:", error);
        this.clearAuth();
      }
    }
    this.isInitializing = false;
  }

  private saveToStorage() {
    if (this.authToken && this.user) {
      localStorage.setItem("auth_token", this.authToken);
      localStorage.setItem("user_data", JSON.stringify(this.user));
    }
  }

  clearAuth() {
    this.user = null;
    this.authToken = null;
    this.isAuthenticated = false;
    this.isInitializing = false;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
  }

  async login(
    username: string
  ): Promise<{ success: boolean; message?: string }> {
    if (!username.trim()) {
      return { success: false, message: "Username is required" };
    }

    this.isLoading = true;

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data: LoginResponse = await response.json();

      if (data.success) {
        this.user = data.user;
        this.authToken = data.authToken;
        this.isAuthenticated = true;
        this.saveToStorage();

        return {
          success: true,
          message: data.isNewUser
            ? "Account created successfully!"
            : "Welcome back!",
        };
      } else {
        return { success: false, message: "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Network error" };
    } finally {
      this.isLoading = false;
    }
  }

  async verifyToken(): Promise<boolean> {
    if (!this.authToken) {
      this.isInitializing = false;
      return false;
    }

    try {
      const response = await fetch("/api/users/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.user) {
        this.user = data.user;
        this.isAuthenticated = true;
        this.saveToStorage(); // Re-save to update any user data changes
        console.log("Auto-login successful for user:", data.user.username);
        return true;
      } else {
        console.warn("Token verification failed:", data);
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error("Token verification error:", error);
      this.clearAuth();
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  logout() {
    this.clearAuth();
  }

  async changeUsername(
    oldUsername: string,
    newUsername: string
  ): Promise<{ success: boolean; message: string }> {
    if (!newUsername.trim()) {
      return { success: false, message: "New username is required" };
    }

    if (oldUsername.trim() === newUsername.trim()) {
      return {
        success: false,
        message: "New username must be different from current username",
      };
    }

    this.isLoading = true;

    try {
      const response = await fetch("/api/users/change-username", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          oldUsername: oldUsername.trim(),
          newUsername: newUsername.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        this.authToken = data.user.authToken;
        this.saveToStorage();

        return {
          success: true,
          message: "Username changed successfully!",
        };
      } else {
        return {
          success: false,
          message: data.message || "Username change failed",
        };
      }
    } catch (error) {
      console.error("Username change error:", error);
      return { success: false, message: "Network error" };
    } finally {
      this.isLoading = false;
    }
  }
}
