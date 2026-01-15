import { apiFetch } from "./api";

// Types for goal summary in daily plan responses
export interface GoalSummary {
  id: number;
  title: string;
  time_scale: string;
  status: string;
}

// Daily Task type
export interface DailyTask {
  id?: number;
  title: string;
  completed: boolean;
  position: number;
  goal_id: number | null;
  goal: GoalSummary | null;
  _destroy?: boolean;
}

// Top Priority type
export interface TopPriority {
  id?: number;
  title: string;
  priority_order: number;
  goal_id: number | null;
  goal: GoalSummary | null;
  _destroy?: boolean;
}

// Completion stats
export interface CompletionStats {
  total: number;
  completed: number;
  percentage: number;
}

// Daily Plan type
export interface DailyPlan {
  id: number;
  date: string;
  intention: string | null;
  user_id: number;
  family_id: number;
  completion_stats: CompletionStats;
  daily_tasks: DailyTask[];
  top_priorities: TopPriority[];
  yesterday_incomplete_tasks: DailyTask[];
  created_at: string;
  updated_at: string;
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

// API functions
export async function getTodaysPlan(familyId: number): Promise<DailyPlan> {
  return apiFetch<DailyPlan>(`/families/${familyId}/daily_plans/today`);
}

export async function getDailyPlan(
  familyId: number,
  planId: number
): Promise<DailyPlan> {
  return apiFetch<DailyPlan>(`/families/${familyId}/daily_plans/${planId}`);
}

export async function updateDailyPlan(
  familyId: number,
  planId: number,
  data: UpdateDailyPlanData
): Promise<{
  message: string;
  daily_plan: DailyPlan;
  is_first_action: boolean;
}> {
  return apiFetch<{
    message: string;
    daily_plan: DailyPlan;
    is_first_action: boolean;
  }>(`/families/${familyId}/daily_plans/${planId}`, {
    method: "PATCH",
    body: JSON.stringify({ daily_plan: data }),
  });
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
