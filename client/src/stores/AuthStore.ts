import { makeAutoObservable } from 'mobx';

export interface User {
  id: number;
  username: string;
  createdAt: string;
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

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        this.authToken = token;
        this.user = JSON.parse(userData);
        this.isAuthenticated = true;
        // Verify token is still valid
        this.verifyToken();
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  private saveToStorage() {
    if (this.authToken && this.user) {
      localStorage.setItem('auth_token', this.authToken);
      localStorage.setItem('user_data', JSON.stringify(this.user));
    }
  }

  clearAuth() {
    this.user = null;
    this.authToken = null;
    this.isAuthenticated = false;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  async login(username: string): Promise<{ success: boolean; message?: string }> {
    if (!username.trim()) {
      return { success: false, message: 'Username is required' };
    }

    this.isLoading = true;
    
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
          message: data.isNewUser ? 'Account created successfully!' : 'Welcome back!' 
        };
      } else {
        return { success: false, message: 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    } finally {
      this.isLoading = false;
    }
  }

  async verifyToken(): Promise<boolean> {
    if (!this.authToken) return false;

    try {
      const response = await fetch('/api/users/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        this.isAuthenticated = true;
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearAuth();
      return false;
    }
  }

  logout() {
    this.clearAuth();
  }
}
