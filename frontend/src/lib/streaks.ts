import { apiFetch } from "./api";

// Streak types
export type StreakType =
  | "daily_planning"
  | "evening_reflection"
  | "weekly_review";

export interface Streak {
  id: number;
  streak_type: StreakType;
  current_count: number;
  longest_count: number;
  last_activity_date: string | null;
  at_risk: boolean;
  next_milestone: number | null;
  created_at: string;
  updated_at: string;
}

export interface StreaksResponse {
  streaks: Streak[];
}

// Get user's streaks
export async function getStreaks(): Promise<StreaksResponse> {
  return apiFetch("/users/me/streaks");
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

// Milestone thresholds (from backend)
export const MILESTONE_THRESHOLDS = [7, 14, 30, 60, 90, 180, 365];

// Get milestone message
export function getMilestoneMessage(milestone: number): string {
  switch (milestone) {
    case 7:
      return "One week!";
    case 14:
      return "Two weeks!";
    case 30:
      return "One month!";
    case 60:
      return "Two months!";
    case 90:
      return "Three months!";
    case 180:
      return "Six months!";
    case 365:
      return "One year!";
    default:
      return `${milestone} days!`;
  }
}

// Get total streak count across all types
export function getTotalStreakCount(streaks: Streak[]): number {
  return streaks.reduce((sum, streak) => sum + streak.current_count, 0);
}

// Check if any streak is at risk
export function hasAtRiskStreak(streaks: Streak[]): boolean {
  return streaks.some((streak) => streak.at_risk);
}

// Get at risk streaks
export function getAtRiskStreaks(streaks: Streak[]): Streak[] {
  return streaks.filter((streak) => streak.at_risk);
}
