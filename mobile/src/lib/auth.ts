import type {
  User,
  AuthResponse,
  LoginData,
  RegisterData,
  RefreshResponse,
} from "@shared/types";
import { apiFetch, authFetch } from "./api";

export async function login(data: LoginData): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ user: data }),
  });
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
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

export async function refreshTokens(
  refreshToken: string
): Promise<RefreshResponse> {
  return apiFetch<RefreshResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch<{ message: string }>("/auth/password", {
    method: "POST",
    body: JSON.stringify({ user: { email } }),
  });
}

export { authFetch };
export type { User, AuthResponse, LoginData, RegisterData };
