import { authFetch } from "./api";
import type { Goal, GoalFilters } from "@shared/types";

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
