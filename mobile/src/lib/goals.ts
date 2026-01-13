import { authFetch } from "./api";
import type {
  Goal,
  GoalFilters,
  CreateGoalData,
  UpdateGoalData,
  GoalRefinementResponse,
  FamilyMember,
} from "@shared/types";

// Goals list response
export interface GoalsResponse {
  goals: Goal[];
  meta: {
    total_count: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// Build query string from filters
function buildQueryString(filters?: GoalFilters): string {
  if (!filters) return "";

  const params = new URLSearchParams();

  if (filters.time_scale) {
    params.append("time_scale", filters.time_scale);
  }
  if (filters.status) {
    params.append("status", filters.status);
  }
  if (filters.visibility) {
    params.append("visibility", filters.visibility);
  }
  if (filters.assignee_id) {
    params.append("assignee_id", filters.assignee_id.toString());
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

// Get all goals for a family
export async function getGoals(
  familyId: number,
  filters?: GoalFilters
): Promise<GoalsResponse> {
  const queryString = buildQueryString(filters);
  return authFetch<GoalsResponse>(`/families/${familyId}/goals${queryString}`);
}

// Get a single goal
export async function getGoal(familyId: number, goalId: number): Promise<Goal> {
  return authFetch<Goal>(`/families/${familyId}/goals/${goalId}`);
}

// Helper to get goals suitable for linking (active goals)
export async function getLinkableGoals(familyId: number): Promise<Goal[]> {
  const response = await getGoals(familyId);
  // Filter out completed and abandoned goals
  return response.goals.filter(
    (goal) => goal.status !== "completed" && goal.status !== "abandoned"
  );
}

// Helper to format goal time scale for display
export function formatTimeScale(timeScale: string): string {
  const labels: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    annual: "Annual",
  };
  return labels[timeScale] || timeScale;
}

// Helper to get status badge color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    not_started: "#9CA3AF", // gray
    in_progress: "#3B82F6", // blue
    at_risk: "#F59E0B", // amber
    completed: "#10B981", // green
    abandoned: "#6B7280", // gray
  };
  return colors[status] || "#9CA3AF";
}

// Helper to format status for display
export function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    at_risk: "At Risk",
    completed: "Completed",
    abandoned: "Abandoned",
  };
  return labels[status] || status;
}

// Create a new goal
export async function createGoal(
  familyId: number,
  data: CreateGoalData
): Promise<Goal> {
  return authFetch<Goal>(`/families/${familyId}/goals`, {
    method: "POST",
    body: JSON.stringify({ goal: data }),
  });
}

// Update an existing goal
export async function updateGoal(
  familyId: number,
  goalId: number,
  data: UpdateGoalData
): Promise<Goal> {
  return authFetch<Goal>(`/families/${familyId}/goals/${goalId}`, {
    method: "PATCH",
    body: JSON.stringify({ goal: data }),
  });
}

// Delete a goal
export async function deleteGoal(
  familyId: number,
  goalId: number
): Promise<void> {
  await authFetch<void>(`/families/${familyId}/goals/${goalId}`, {
    method: "DELETE",
  });
}

// Get AI goal refinement suggestions
export async function refineGoal(
  goalId: number
): Promise<GoalRefinementResponse> {
  return authFetch<GoalRefinementResponse>(`/goals/${goalId}/refine`, {
    method: "POST",
  });
}

// Family members response for assignee selection
export interface FamilyMembersResponse {
  members: FamilyMember[];
}

// Get family members for assignee selection
export async function getFamilyMembers(
  familyId: number
): Promise<FamilyMembersResponse> {
  return authFetch<FamilyMembersResponse>(`/families/${familyId}/members`);
}

// Helper to format visibility for display
export function formatVisibility(visibility: string): string {
  const labels: Record<string, string> = {
    personal: "Personal",
    shared: "Shared",
    family: "Family",
  };
  return labels[visibility] || visibility;
}

// Helper to get visibility icon
export function getVisibilityEmoji(visibility: string): string {
  const emojis: Record<string, string> = {
    personal: "🔒",
    shared: "👥",
    family: "👨‍👩‍👧‍👦",
  };
  return emojis[visibility] || "📋";
}

// Helper to get time scale emoji
export function getTimeScaleEmoji(timeScale: string): string {
  const emojis: Record<string, string> = {
    daily: "📅",
    weekly: "📆",
    monthly: "🗓️",
    quarterly: "📊",
    annual: "🎯",
  };
  return emojis[timeScale] || "📋";
}

// Helper to format due date for display
export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "No due date";
  const date = new Date(dueDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} overdue`;
  } else if (diffDays === 0) {
    return "Due today";
  } else if (diffDays === 1) {
    return "Due tomorrow";
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}
