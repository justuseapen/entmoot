import { authFetch } from "./api";
import type { DailyPlan, DailyTask, TopPriority } from "@shared/types";

// Goal summary type for display in daily planner
export interface GoalSummary {
  id: number;
  title: string;
  time_scale: string;
  status: string;
}

// Extended Daily Task with goal info
export interface DailyTaskWithGoal extends DailyTask {
  goal: GoalSummary | null;
  _destroy?: boolean;
}

// Extended Top Priority with goal info
export interface TopPriorityWithGoal extends TopPriority {
  goal_id?: number | null;
  goal: GoalSummary | null;
  _destroy?: boolean;
}

// Extended Daily Plan type with completion stats
export interface DailyPlanWithStats extends Omit<
  DailyPlan,
  "tasks" | "top_priorities"
> {
  completion_stats: {
    total: number;
    completed: number;
    percentage: number;
  };
  daily_tasks: DailyTaskWithGoal[];
  top_priorities: TopPriorityWithGoal[];
  yesterday_incomplete_tasks: DailyTaskWithGoal[];
}

// Task attributes for creating/updating
export interface DailyTaskAttributes {
  id?: number;
  title: string;
  completed?: boolean;
  position?: number;
  goal_id?: number | null;
  _destroy?: boolean;
}

// Priority attributes for creating/updating
export interface TopPriorityAttributes {
  id?: number;
  title: string;
  priority_order: number;
  goal_id?: number | null;
  _destroy?: boolean;
}

// Update data type
export interface UpdateDailyPlanData {
  intention?: string | null;
  daily_tasks_attributes?: DailyTaskAttributes[];
  top_priorities_attributes?: TopPriorityAttributes[];
}

// Update response type
export interface UpdateDailyPlanResponse {
  message: string;
  daily_plan: DailyPlanWithStats;
  is_first_action: boolean;
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

export async function updateDailyPlan(
  familyId: number,
  planId: number,
  data: UpdateDailyPlanData
): Promise<UpdateDailyPlanResponse> {
  return authFetch<UpdateDailyPlanResponse>(
    `/families/${familyId}/daily_plans/${planId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ daily_plan: data }),
    }
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
