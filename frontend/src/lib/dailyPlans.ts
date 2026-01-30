import { apiFetch, type Mention } from "./api";

// Types for goal summary in daily plan responses
export interface GoalSummary {
  id: number;
  title: string;
  time_scale: string;
  status: string;
}

// User summary for assignee
export interface UserSummary {
  id: number;
  name: string;
  avatar_url: string | null;
}

// Habit type
export interface Habit {
  id: number;
  name: string;
  position: number;
  is_active: boolean;
}

// Habit Completion type
export interface HabitCompletion {
  id: number;
  habit_id: number;
  daily_plan_id: number;
  completed: boolean;
  habit: Habit;
}

// Habit Completion attributes for creating/updating
export interface HabitCompletionAttributes {
  id?: number;
  habit_id: number;
  completed: boolean;
}

// Daily Task type
export interface DailyTask {
  id?: number;
  title: string;
  completed: boolean;
  position: number;
  goal_id: number | null;
  goal: GoalSummary | null;
  assignee_id: number | null;
  assignee: UserSummary | null;
  _destroy?: boolean;
}

// Top Priority type
export interface TopPriority {
  id?: number;
  title: string;
  priority_order: number;
  goal_id?: number | null;
  goal?: GoalSummary | null;
  completed?: boolean;
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
  shutdown_shipped: string | null;
  shutdown_blocked: string | null;
  user_id: number;
  family_id: number;
  completion_stats: CompletionStats;
  daily_tasks: DailyTask[];
  top_priorities: TopPriority[];
  habit_completions: HabitCompletion[];
  yesterday_incomplete_tasks: DailyTask[];
  mentions?: Mention[];
  created_at: string;
  updated_at: string;
}

// Filter params for listing daily plans
export interface DailyPlanFilters {
  mentioned_by?: number;
}

// Task attributes for creating/updating
export interface DailyTaskAttributes {
  id?: number;
  title: string;
  completed?: boolean;
  position?: number;
  goal_id?: number | null;
  assignee_id?: number | null;
  _destroy?: boolean;
}

// Priority attributes for creating/updating
export interface TopPriorityAttributes {
  id?: number;
  title: string;
  priority_order: number;
  goal_id?: number | null;
  completed?: boolean;
  _destroy?: boolean;
}

// Update data type
export interface UpdateDailyPlanData {
  intention?: string | null;
  shutdown_shipped?: string | null;
  shutdown_blocked?: string | null;
  daily_tasks_attributes?: DailyTaskAttributes[];
  top_priorities_attributes?: TopPriorityAttributes[];
  habit_completions_attributes?: HabitCompletionAttributes[];
}

// API functions
export async function getDailyPlans(
  familyId: number,
  filters?: DailyPlanFilters
): Promise<{ daily_plans: DailyPlan[] }> {
  const params = new URLSearchParams();
  if (filters?.mentioned_by)
    params.append("mentioned_by", filters.mentioned_by.toString());

  const queryString = params.toString();
  const url = `/families/${familyId}/daily_plans${queryString ? `?${queryString}` : ""}`;

  return apiFetch<{ daily_plans: DailyPlan[] }>(url);
}

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

// Habits API response
export interface HabitsResponse {
  habits: Habit[];
}

// Get habits for a family (user's active habits)
export async function getHabits(familyId: number): Promise<HabitsResponse> {
  return apiFetch<HabitsResponse>(`/families/${familyId}/habits`);
}
