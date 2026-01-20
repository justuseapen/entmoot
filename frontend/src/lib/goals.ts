import { apiFetch, type Mention } from "./api";

// User type for goal responses
export interface GoalUser {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

// Goal type
export interface Goal {
  id: number;
  title: string;
  description: string | null;
  time_scale: TimeScale;
  status: GoalStatus;
  visibility: GoalVisibility;
  progress: number;
  due_date: string | null;
  parent_id: number | null;
  family_id: number;
  creator: GoalUser;
  assignees: GoalUser[];
  mentions?: Mention[];
  created_at: string;
  updated_at: string;
  // SMART fields (included in detail view)
  specific?: string | null;
  measurable?: string | null;
  achievable?: string | null;
  relevant?: string | null;
  time_bound?: string | null;
}

// Enums
export type TimeScale = "daily" | "weekly" | "monthly" | "quarterly" | "annual";
export type GoalStatus =
  | "not_started"
  | "in_progress"
  | "at_risk"
  | "completed"
  | "abandoned";
export type GoalVisibility = "personal" | "shared" | "family";

// Create/Update data types
export interface CreateGoalData {
  title: string;
  description?: string;
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  time_bound?: string;
  time_scale: TimeScale;
  status?: GoalStatus;
  visibility?: GoalVisibility;
  progress?: number;
  due_date?: string;
  parent_id?: number | null;
  assignee_ids?: number[];
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  time_bound?: string;
  time_scale?: TimeScale;
  status?: GoalStatus;
  visibility?: GoalVisibility;
  progress?: number;
  due_date?: string;
  parent_id?: number | null;
  assignee_ids?: number[];
}

// Filter params for listing goals
export interface GoalFilters {
  time_scale?: TimeScale;
  status?: GoalStatus;
  visibility?: GoalVisibility;
  assignee_id?: number;
  mentioned_by?: number;
}

// API functions
export async function getGoals(
  familyId: number,
  filters?: GoalFilters
): Promise<{ goals: Goal[] }> {
  const params = new URLSearchParams();
  if (filters?.time_scale) params.append("time_scale", filters.time_scale);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.visibility) params.append("visibility", filters.visibility);
  if (filters?.assignee_id)
    params.append("assignee_id", filters.assignee_id.toString());
  if (filters?.mentioned_by)
    params.append("mentioned_by", filters.mentioned_by.toString());

  const queryString = params.toString();
  const url = `/families/${familyId}/goals${queryString ? `?${queryString}` : ""}`;

  return apiFetch<{ goals: Goal[] }>(url);
}

export async function getGoal(
  familyId: number,
  goalId: number
): Promise<{ goal: Goal }> {
  return apiFetch<{ goal: Goal }>(`/families/${familyId}/goals/${goalId}`);
}

export interface CreateGoalResponse {
  message: string;
  goal: Goal;
  is_first_goal: boolean;
  is_first_action: boolean;
}

export async function createGoal(
  familyId: number,
  data: CreateGoalData
): Promise<CreateGoalResponse> {
  return apiFetch<CreateGoalResponse>(`/families/${familyId}/goals`, {
    method: "POST",
    body: JSON.stringify({ goal: data }),
  });
}

export async function updateGoal(
  familyId: number,
  goalId: number,
  data: UpdateGoalData
): Promise<{ message: string; goal: Goal }> {
  return apiFetch<{ message: string; goal: Goal }>(
    `/families/${familyId}/goals/${goalId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ goal: data }),
    }
  );
}

export async function deleteGoal(
  familyId: number,
  goalId: number
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/families/${familyId}/goals/${goalId}`,
    {
      method: "DELETE",
    }
  );
}

// Constants for UI
export const timeScaleOptions: { value: TimeScale; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

export const statusOptions: {
  value: GoalStatus;
  label: string;
  color: string;
}[] = [
  { value: "not_started", label: "Not Started", color: "bg-gray-400" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { value: "at_risk", label: "At Risk", color: "bg-yellow-500" },
  { value: "completed", label: "Completed", color: "bg-green-500" },
  { value: "abandoned", label: "Abandoned", color: "bg-red-400" },
];

export const visibilityOptions: {
  value: GoalVisibility;
  label: string;
  description: string;
}[] = [
  {
    value: "personal",
    label: "Personal",
    description: "Only you can see this goal",
  },
  {
    value: "shared",
    label: "Shared",
    description: "Visible to you and assigned members",
  },
  {
    value: "family",
    label: "Family",
    description: "Visible to all family members",
  },
];

// Helper functions
export function getStatusColor(status: GoalStatus): string {
  return statusOptions.find((s) => s.value === status)?.color || "bg-gray-400";
}

export function getStatusLabel(status: GoalStatus): string {
  return statusOptions.find((s) => s.value === status)?.label || status;
}

export function getTimeScaleLabel(timeScale: TimeScale): string {
  return (
    timeScaleOptions.find((t) => t.value === timeScale)?.label || timeScale
  );
}

export function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isDueSoon(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  const today = new Date();
  const diffDays = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays >= 0 && diffDays <= 7;
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  const today = new Date();
  return date < today;
}

// AI Refinement Types
export interface SmartSuggestions {
  specific: string | null;
  measurable: string | null;
  achievable: string | null;
  relevant: string | null;
  time_bound: string | null;
}

export interface Obstacle {
  obstacle: string;
  mitigation: string;
}

export interface Milestone {
  title: string;
  description: string | null;
  suggested_progress: number;
}

export interface GoalRefinementResponse {
  smart_suggestions: SmartSuggestions;
  alternative_titles: string[];
  alternative_descriptions: string[];
  potential_obstacles: Obstacle[];
  milestones: Milestone[];
  overall_feedback: string;
}

// AI Refinement API
export async function refineGoal(
  familyId: number,
  goalId: number
): Promise<{ refinement: GoalRefinementResponse }> {
  return apiFetch<{ refinement: GoalRefinementResponse }>(
    `/families/${familyId}/goals/${goalId}/refine`,
    {
      method: "POST",
    }
  );
}

// SMART field labels for display
export const smartFieldLabels: Record<keyof SmartSuggestions, string> = {
  specific: "Specific",
  measurable: "Measurable",
  achievable: "Achievable",
  relevant: "Relevant",
  time_bound: "Time-Bound",
};

// SMART field descriptions for context
export const smartFieldDescriptions: Record<keyof SmartSuggestions, string> = {
  specific: "What exactly will you accomplish?",
  measurable: "How will you track progress?",
  achievable: "Is this goal realistic?",
  relevant: "Why does this goal matter?",
  time_bound: "When will you achieve this?",
};
