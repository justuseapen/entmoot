import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getDailyPlans,
  getTodaysPlan,
  getDailyPlan,
  updateDailyPlan,
  type UpdateDailyPlanData,
  type DailyPlanFilters,
} from "@/lib/dailyPlans";

// Query keys
export const dailyPlanKeys = {
  all: ["dailyPlans"] as const,
  lists: () => [...dailyPlanKeys.all, "list"] as const,
  list: (familyId: number, filters?: DailyPlanFilters) =>
    [...dailyPlanKeys.lists(), familyId, filters] as const,
  details: () => [...dailyPlanKeys.all, "detail"] as const,
  today: (familyId: number) =>
    [...dailyPlanKeys.all, "today", familyId] as const,
  detail: (familyId: number, planId: number) =>
    [...dailyPlanKeys.details(), familyId, planId] as const,
};

// List daily plans with filters
export function useDailyPlans(familyId: number, filters?: DailyPlanFilters) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: dailyPlanKeys.list(familyId, filters),
    queryFn: () => getDailyPlans(familyId, filters),
    enabled: isAuthenticated && !!familyId,
    select: (data) => data.daily_plans,
  });
}

// Today's plan query
export function useTodaysPlan(familyId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: dailyPlanKeys.today(familyId),
    queryFn: () => getTodaysPlan(familyId),
    enabled: isAuthenticated && !!familyId,
  });
}

// Specific daily plan query
export function useDailyPlan(familyId: number, planId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: dailyPlanKeys.detail(familyId, planId),
    queryFn: () => getDailyPlan(familyId, planId),
    enabled: isAuthenticated && !!familyId && !!planId,
  });
}

// Update daily plan mutation
export function useUpdateDailyPlan(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      data,
    }: {
      planId: number;
      data: UpdateDailyPlanData;
    }) => updateDailyPlan(familyId, planId, data),
    onSuccess: (response) => {
      // Update the today's plan cache
      queryClient.setQueryData(
        dailyPlanKeys.today(familyId),
        response.daily_plan
      );
      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({
        queryKey: dailyPlanKeys.today(familyId),
      });
    },
  });
}
