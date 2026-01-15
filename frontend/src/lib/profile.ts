import { apiFetch } from "./api";
import type { User } from "./auth";

export interface UpdateProfileData {
  name?: string;
  avatar_url?: string;
}

export interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface DeleteAccountData {
  password: string;
}

export interface UserDataExport {
  exported_at: string;
  user: {
    id: number;
    email: string;
    name: string;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  };
  families: Array<{
    family_id: number;
    family_name: string;
    role: string;
    joined_at: string;
  }>;
  goals: Array<{
    id: number;
    title: string;
    description: string | null;
    time_scale: string;
    status: string;
    progress: number;
    created_at: string;
  }>;
  daily_plans: Array<{
    id: number;
    date: string;
    intention: string | null;
    tasks: Array<{ title: string; completed: boolean }>;
    priorities: Array<{ title: string; order: number }>;
    created_at: string;
  }>;
  reflections: Array<{
    id: number;
    reflection_type: string;
    mood: string | null;
    energy_level: number | null;
    gratitude_items: string[];
    responses: Array<{ prompt: string; response: string }>;
    created_at: string;
  }>;
  weekly_reviews: Array<{
    id: number;
    week_start_date: string;
    wins: string[];
    challenges: string[];
    lessons_learned: string | null;
    completed: boolean;
    created_at: string;
  }>;
  streaks: Array<{
    streak_type: string;
    current_count: number;
    longest_count: number;
    last_activity_date: string | null;
  }>;
  badges: Array<{
    badge_name: string;
    badge_description: string;
    earned_at: string;
  }>;
  points: {
    total: number;
    entries: Array<{
      points: number;
      activity_type: string;
      created_at: string;
    }>;
  };
  notifications: Array<{
    title: string;
    body: string | null;
    notification_type: string;
    read: boolean;
    created_at: string;
  }>;
  notification_preferences: {
    channels?: {
      in_app: boolean;
      email: boolean;
      push: boolean;
    };
    reminders?: {
      morning_planning: { enabled: boolean; time: string };
      evening_reflection: { enabled: boolean; time: string };
      weekly_review: { enabled: boolean; time: string; day: number };
    };
    quiet_hours?: {
      start: string;
      end: string;
    };
  };
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/users/me/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function changePassword(
  data: ChangePasswordData
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(
  data: DeleteAccountData
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/users/me", {
    method: "DELETE",
    body: JSON.stringify(data),
  });
}

export async function exportUserData(): Promise<UserDataExport> {
  return apiFetch<UserDataExport>("/users/me/export");
}

export function downloadJson(data: UserDataExport, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
