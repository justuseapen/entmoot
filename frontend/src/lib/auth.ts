import { apiFetch } from "./api";

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at?: string;
  onboarding_wizard_completed_at?: string | null;
  onboarding_wizard_last_step?: number | null;
}

export interface AuthResponse {
  message: string;
  user: User;
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

export async function logout(): Promise<void> {
  await apiFetch<{ message: string }>("/auth/logout", {
    method: "DELETE",
  });
}

export async function getCurrentUser(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/auth/me");
}
