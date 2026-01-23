import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  refineGoal,
  regenerateSubGoals,
  updateGoalPositions,
  type CreateGoalData,
  type UpdateGoalData,
  type GoalFilters,
  type GoalPositionUpdate,
} from "@/lib/goals";

// Query keys
export const goalKeys = {
  all: ["goals"] as const,
  lists: () => [...goalKeys.all, "list"] as const,
  list: (familyId: number, filters?: GoalFilters) =>
    [...goalKeys.lists(), familyId, filters] as const,
  details: () => [...goalKeys.all, "detail"] as const,
  detail: (familyId: number, goalId: number) =>
    [...goalKeys.details(), familyId, goalId] as const,
};

// Goal queries
export function useGoals(familyId: number, filters?: GoalFilters) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: goalKeys.list(familyId, filters),
    queryFn: () => getGoals(familyId, filters),
    enabled: isAuthenticated && !!familyId,
    select: (data) => data.goals,
  });
}

export function useGoal(familyId: number, goalId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: goalKeys.detail(familyId, goalId),
    queryFn: () => getGoal(familyId, goalId),
    enabled: isAuthenticated && !!familyId && !!goalId,
    select: (data) => data.goal,
  });
}

// Goal mutations
export function useCreateGoal(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGoalData) => createGoal(familyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      // Also invalidate first goal prompt status since user may have created their first goal
      queryClient.invalidateQueries({ queryKey: ["firstGoalPrompt"] });
    },
  });
}

export function useUpdateGoal(familyId: number, goalId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateGoalData) => updateGoal(familyId, goalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: goalKeys.detail(familyId, goalId),
      });
    },
  });
}

export function useDeleteGoal(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: number) => deleteGoal(familyId, goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
    },
  });
}

// AI Refinement mutation
export function useRefineGoal(familyId: number, goalId: number) {
  return useMutation({
    mutationFn: () => refineGoal(familyId, goalId),
    // Don't invalidate queries - refinement doesn't change the goal until user accepts
  });
}

// Sub-goal regeneration mutation
export function useRegenerateSubGoals(familyId: number, goalId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => regenerateSubGoals(familyId, goalId),
    onSuccess: () => {
      // Invalidate goal lists and the specific goal to show updated children
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: goalKeys.detail(familyId, goalId),
      });
    },
  });
}

// Update goal positions mutation
export function useUpdateGoalPositions(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (positions: GoalPositionUpdate[]) =>
      updateGoalPositions(familyId, positions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
    },
  });
}

// Convenience hook for annual goals
export function useAnnualGoals(familyId: number) {
  return useGoals(familyId, { time_scale: "annual" });
}

// Convenience hook for sub-goals (children of a parent goal)
export function useSubGoals(familyId: number, parentId: number | null) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: goalKeys.list(familyId, { parent_id: parentId ?? undefined }),
    queryFn: () => getGoals(familyId, { parent_id: parentId ?? undefined }),
    enabled: isAuthenticated && !!familyId && !!parentId,
    select: (data) => data.goals,
  });
}
