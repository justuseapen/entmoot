import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

/** User summary for goal creator/assignees */
export interface GoalUser {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

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
  // SMART fields (included in detail response)
  specific: string | null;
  measurable: string | null;
  achievable: string | null;
  relevant: string | null;
  time_bound: string | null;
  // Relations
  creator?: GoalUser;
  assignees?: GoalUser[];
  children?: Goal[];
  // Timestamps
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

/** Payload for creating a goal */
export interface CreateGoalPayload {
  title: string;
  description?: string;
  time_scale: GoalTimeScale;
  status?: GoalStatus;
  visibility?: GoalVisibility;
  progress?: number;
  due_date?: string;
  parent_id?: number;
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  time_bound?: string;
  assignee_ids?: number[];
}

/** Payload for updating a goal */
export interface UpdateGoalPayload {
  title?: string;
  description?: string;
  time_scale?: GoalTimeScale;
  status?: GoalStatus;
  visibility?: GoalVisibility;
  progress?: number;
  due_date?: string;
  parent_id?: number;
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  time_bound?: string;
  assignee_ids?: number[];
}

/** Response from create/update goal endpoints */
export interface GoalResponse {
  message: string;
  goal: Goal;
  is_first_goal?: boolean;
  is_first_action?: boolean;
}

/** SMART suggestion from AI refinement */
export interface SmartSuggestions {
  specific: string | null;
  measurable: string | null;
  achievable: string | null;
  relevant: string | null;
  time_bound: string | null;
}

/** Potential obstacle from AI refinement */
export interface PotentialObstacle {
  obstacle: string | null;
  mitigation: string | null;
}

/** Milestone suggestion from AI refinement */
export interface MilestoneSuggestion {
  title: string;
  description: string | null;
  suggested_progress: number;
}

/** Response from goal refinement endpoint */
export interface GoalRefinementResponse {
  suggestions: {
    smart_suggestions: SmartSuggestions;
    alternative_titles: string[];
    alternative_descriptions: string[];
    potential_obstacles: PotentialObstacle[];
    milestones: MilestoneSuggestion[];
    overall_feedback: string;
  };
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

      const response = await api.get<{ goals: Goal[] }>(url);
      return response.goals;
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
      const response = await api.get<{ goal: Goal }>(
        `/families/${currentFamilyId}/goals/${goalId}`
      );
      return response.goal;
    },
    enabled: !!currentFamilyId && !!goalId,
  });
}

/**
 * Hook to create a new goal.
 * Invalidates the goals list query on success.
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async (payload: CreateGoalPayload) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      return api.post<GoalResponse>(`/families/${currentFamilyId}/goals`, {
        goal: payload,
      });
    },
    onSuccess: () => {
      // Invalidate all goal lists to refresh with new goal
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
    },
  });
}

/**
 * Hook to update an existing goal.
 * Invalidates relevant queries on success.
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async ({
      goalId,
      payload,
    }: {
      goalId: number;
      payload: UpdateGoalPayload;
    }) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      return api.patch<GoalResponse>(
        `/families/${currentFamilyId}/goals/${goalId}`,
        { goal: payload }
      );
    },
    onSuccess: (data, variables) => {
      // Update the goal detail in cache
      if (currentFamilyId) {
        queryClient.setQueryData(
          goalsKeys.detail(currentFamilyId, variables.goalId),
          data.goal
        );
      }
      // Invalidate all goal lists to reflect changes
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
    },
  });
}

/**
 * Hook to delete a goal.
 * Invalidates goal queries on success.
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async (goalId: number) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      return api.del<{ message: string }>(
        `/families/${currentFamilyId}/goals/${goalId}`
      );
    },
    onSuccess: (_data, goalId) => {
      // Remove the goal detail from cache
      if (currentFamilyId) {
        queryClient.removeQueries({
          queryKey: goalsKeys.detail(currentFamilyId, goalId),
        });
      }
      // Invalidate all goal lists
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
    },
  });
}

/**
 * Hook to refine a goal using AI.
 * Returns SMART suggestions and other improvements.
 */
export function useRefineGoal() {
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async (goalId: number) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      return api.post<GoalRefinementResponse>(
        `/families/${currentFamilyId}/goals/${goalId}/refine`,
        {}
      );
    },
  });
}
