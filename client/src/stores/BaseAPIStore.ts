import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { action, makeObservable, observable, runInAction } from "mobx";

export class BaseAPIStore {
  private api!: AxiosInstance; // Use definite assignment assertion
  loading: boolean = false;
  error: string | null = null;

  constructor() {
    // Initialize API first
    this.initializeAPI();

    // Then make only specific properties observable
    makeObservable(this, {
      loading: observable,
      error: observable,
      setLoading: action,
      setError: action,
      clearError: action,
      clearCurrentError: action,
    });
  }

  private initializeAPI() {
    const baseURL = this.getBaseURL();

    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        runInAction(() => {
          this.setLoading(true);
          this.clearError();
        });
        // Attach auth token from localStorage if present
        const token = localStorage.getItem("auth_token");
        if (token) {
          // Ensure headers exists
          config.headers = config.headers || {};
          (config.headers as any)["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        runInAction(() => {
          this.setLoading(false);
          this.setError("Request setup failed");
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        runInAction(() => {
          this.setLoading(false);
        });
        return response;
      },
      (error) => {
        runInAction(() => {
          this.setLoading(false);
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "An unknown error occurred";
          this.setError(errorMessage);
        });
        return Promise.reject(error);
      }
    );
  }

  private getBaseURL(): string {
    // Check if we're in development mode
    if (import.meta.env.DEV || window.location.hostname === "localhost") {
      return "http://localhost:3000";
    }

    // In production, use the same origin (for SPA served by backend)
    return window.location.origin;
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  clearError() {
    this.error = null;
  }

  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // POST request
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // PATCH request
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.patch(
        url,
        data,
        config
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get current base URL for debugging
  get currentBaseURL(): string {
    return this.api.defaults.baseURL || "";
  }

  // Manual error clearing
  clearCurrentError() {
    runInAction(() => {
      this.clearError();
    });
  }
}
