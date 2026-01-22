import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

// ============================================================================
// Types
// ============================================================================

/** Status options for goals */
export type GoalStatus =
  | "not_started"
  | "in_progress"
  | "at_risk"
  | "completed"
  | "abandoned";

/** Time scale options for goals */
export type GoalTimeScale =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual";

/** Visibility options for goals */
export type GoalVisibility = "personal" | "shared" | "family";

/** A goal from the API */
export interface Goal {
  id: number;
  title: string;
  description: string | null;
  time_scale: GoalTimeScale;
  status: GoalStatus;
  visibility: GoalVisibility;
  progress: number;
  due_date: string | null;
  family_id: number;
  parent_id: number | null;
  specific: string | null;
  measurable: string | null;
  achievable: string | null;
  relevant: string | null;
  time_bound: string | null;
  created_at: string;
  updated_at: string;
}

/** Filters for fetching goals */
export interface GoalFilters {
  time_scale?: GoalTimeScale;
  status?: GoalStatus;
  visibility?: GoalVisibility;
  assignee_id?: number;
}

// ============================================================================
// Query Keys
// ============================================================================

export const goalsKeys = {
  all: ["goals"] as const,
  list: (familyId: number, filters?: GoalFilters) =>
    [...goalsKeys.all, "list", familyId, filters] as const,
  detail: (familyId: number, goalId: number) =>
    [...goalsKeys.all, "detail", familyId, goalId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch goals for the current family.
 * Accepts optional filters to filter by time_scale, status, visibility, or assignee.
 */
export function useGoals(filters?: GoalFilters) {
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useQuery({
    queryKey: goalsKeys.list(currentFamilyId ?? 0, filters),
    queryFn: async () => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }

      // Build query params from filters
      const params = new URLSearchParams();
      if (filters?.time_scale) {
        params.append("time_scale", filters.time_scale);
      }
      if (filters?.status) {
        params.append("status", filters.status);
      }
      if (filters?.visibility) {
        params.append("visibility", filters.visibility);
      }
      if (filters?.assignee_id) {
        params.append("assignee_id", filters.assignee_id.toString());
      }

      const queryString = params.toString();
      const url = `/families/${currentFamilyId}/goals${queryString ? `?${queryString}` : ""}`;

      return api.get<Goal[]>(url);
    },
    enabled: !!currentFamilyId,
  });
}

/**
 * Hook to fetch a single goal by ID.
 */
export function useGoal(goalId: number) {
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useQuery({
    queryKey: goalsKeys.detail(currentFamilyId ?? 0, goalId),
    queryFn: async () => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      return api.get<Goal>(`/families/${currentFamilyId}/goals/${goalId}`);
    },
    enabled: !!currentFamilyId && !!goalId,
  });
}
