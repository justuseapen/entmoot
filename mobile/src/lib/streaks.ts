import { authFetch } from "./api";
import type { Streak, StreakType } from "@shared/types";

export interface StreaksResponse {
  streaks: Streak[];
}

// Get user's streaks
export async function getStreaks(): Promise<StreaksResponse> {
  return authFetch<StreaksResponse>("/users/me/streaks");
}

// Helper to get streak label
export function getStreakLabel(streakType: StreakType): string {
  switch (streakType) {
    case "daily_planning":
      return "Daily Planning";
    case "evening_reflection":
      return "Evening Reflection";
    case "weekly_review":
      return "Weekly Review";
    default:
      return streakType;
  }
}

// Helper to get streak emoji
export function getStreakEmoji(streakType: StreakType): string {
  switch (streakType) {
    case "daily_planning":
      return "📅";
    case "evening_reflection":
      return "🌙";
    case "weekly_review":
      return "📊";
    default:
      return "🔥";
  }
}

// Helper to get streak unit (day vs week)
export function getStreakUnit(streakType: StreakType, count: number): string {
  if (streakType === "weekly_review") {
    return count === 1 ? "week" : "weeks";
  }
  return count === 1 ? "day" : "days";
}

// Get total streak count across all types
export function getTotalStreakCount(streaks: Streak[]): number {
  return streaks.reduce((sum, streak) => sum + streak.current_count, 0);
}
