import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { getHabits, type Habit } from "@/lib/dailyPlans";

// Query keys
export const habitsKeys = {
  all: ["habits"] as const,
  list: (familyId: number) => [...habitsKeys.all, "list", familyId] as const,
};

// Hook to fetch user's active habits for a family
export function useHabits(familyId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery<Habit[]>({
    queryKey: habitsKeys.list(familyId),
    queryFn: async () => {
      const response = await getHabits(familyId);
      return response.habits;
    },
    enabled: isAuthenticated && !!familyId,
    staleTime: 60000, // Cache for 1 minute
  });
}
