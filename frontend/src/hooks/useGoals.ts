import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  refineGoal,
  type CreateGoalData,
  type UpdateGoalData,
  type GoalFilters,
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
  const { token } = useAuthStore();
  return useQuery({
    queryKey: goalKeys.list(familyId, filters),
    queryFn: () => getGoals(familyId, token!, filters),
    enabled: !!token && !!familyId,
    select: (data) => data.goals,
  });
}

export function useGoal(familyId: number, goalId: number) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: goalKeys.detail(familyId, goalId),
    queryFn: () => getGoal(familyId, goalId, token!),
    enabled: !!token && !!familyId && !!goalId,
    select: (data) => data.goal,
  });
}

// Goal mutations
export function useCreateGoal(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGoalData) => createGoal(familyId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      // Also invalidate first goal prompt status since user may have created their first goal
      queryClient.invalidateQueries({ queryKey: ["firstGoalPrompt"] });
    },
  });
}

export function useUpdateGoal(familyId: number, goalId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateGoalData) =>
      updateGoal(familyId, goalId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: goalKeys.detail(familyId, goalId),
      });
    },
  });
}

export function useDeleteGoal(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: number) => deleteGoal(familyId, goalId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
    },
  });
}

// AI Refinement mutation
export function useRefineGoal(familyId: number, goalId: number) {
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: () => refineGoal(familyId, goalId, token!),
    // Don't invalidate queries - refinement doesn't change the goal until user accepts
  });
}
