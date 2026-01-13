import { authFetch } from "./api";
import type { DailyPlan, DailyTask } from "@shared/types";

// Extended Daily Plan type with completion stats
export interface DailyPlanWithStats extends DailyPlan {
  completion_stats: {
    total: number;
    completed: number;
    percentage: number;
  };
  yesterday_incomplete_tasks: DailyTask[];
}

// API functions
export async function getTodaysPlan(
  familyId: number
): Promise<DailyPlanWithStats> {
  return authFetch<DailyPlanWithStats>(
    `/families/${familyId}/daily_plans/today`
  );
}

export async function getDailyPlan(
  familyId: number,
  planId: number
): Promise<DailyPlanWithStats> {
  return authFetch<DailyPlanWithStats>(
    `/families/${familyId}/daily_plans/${planId}`
  );
}

// Helper function to format today's date nicely
export function formatTodayDate(): string {
  const today = new Date();
  return today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Helper to get greeting based on time of day
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  } else if (hour < 17) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

// Helper to check if date is today
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
