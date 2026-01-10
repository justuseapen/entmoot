import { apiFetch } from "./api";

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirmation: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RefreshResponse {
  token: string;
  refresh_token: string;
}

export interface ApiError {
  error?: string;
  errors?: Record<string, string[]>;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ user: data }),
  });
}

export async function login(data: LoginData): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ user: data }),
  });
}

export async function logout(token: string): Promise<void> {
  await apiFetch<{ message: string }>("/auth/logout", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getCurrentUser(token: string): Promise<User> {
  return apiFetch<User>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function refreshToken(
  refreshToken: string
): Promise<RefreshResponse> {
  return apiFetch<RefreshResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}
