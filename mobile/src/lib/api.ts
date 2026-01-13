import { config } from "./config";

export interface ApiError {
  error?: string;
  errors?: Record<string, string[]>;
  message?: string;
}

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface FetchOptionsWithAuth extends FetchOptions {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onTokenRefresh:
    | ((token: string, refreshToken: string) => void)
    | null = null;
  private onAuthError: (() => void) | null = null;

  constructor() {
    this.baseUrl = config.apiUrl;
  }

  setTokens(accessToken: string | null, refreshToken: string | null) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  setOnTokenRefresh(callback: (token: string, refreshToken: string) => void) {
    this.onTokenRefresh = callback;
  }

  setOnAuthError(callback: () => void) {
    this.onAuthError = callback;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      this.accessToken = data.token;
      this.refreshToken = data.refresh_token;

      if (this.onTokenRefresh) {
        this.onTokenRefresh(data.token, data.refresh_token);
      }

      return true;
    } catch {
      return false;
    }
  }

  async fetch<T>(endpoint: string, options?: FetchOptionsWithAuth): Promise<T> {
    const { skipAuth, headers: customHeaders, ...restOptions } = options || {};

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    if (!skipAuth && this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...restOptions,
      headers,
    });

    // If we get a 401 and have a refresh token, try to refresh
    if (response.status === 401 && this.refreshToken && !skipAuth) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry the request with new token
        headers.Authorization = `Bearer ${this.accessToken}`;
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...restOptions,
          headers,
        });
      } else {
        // Refresh failed, trigger auth error
        if (this.onAuthError) {
          this.onAuthError();
        }
        throw new Error("Session expired. Please login again.");
      }
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({}));
      const message =
        error.error ||
        error.message ||
        Object.values(error.errors || {})
          .flat()
          .join(", ") ||
        `API error: ${response.status}`;
      throw new Error(message);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();

// Convenience function for unauthenticated requests
export async function apiFetch<T>(
  endpoint: string,
  options?: FetchOptions
): Promise<T> {
  return apiClient.fetch<T>(endpoint, { ...options, skipAuth: true });
}

// Convenience function for authenticated requests
export async function authFetch<T>(
  endpoint: string,
  options?: FetchOptions
): Promise<T> {
  return apiClient.fetch<T>(endpoint, options);
}
