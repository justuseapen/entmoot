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
  onboarding_required?: boolean;
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

export interface PasswordResetResponse {
  message: string;
}

export interface ResetPasswordData {
  reset_password_token: string;
  password: string;
  password_confirmation: string;
}

export async function requestPasswordReset(
  email: string
): Promise<PasswordResetResponse> {
  return apiFetch<PasswordResetResponse>("/auth/password", {
    method: "POST",
    body: JSON.stringify({ user: { email } }),
  });
}

export async function resetPassword(
  data: ResetPasswordData
): Promise<PasswordResetResponse> {
  return apiFetch<PasswordResetResponse>("/auth/password", {
    method: "PUT",
    body: JSON.stringify({ user: data }),
  });
}
