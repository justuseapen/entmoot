import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  updateHabitPositions,
  type Habit,
  type CreateHabitData,
  type UpdateHabitData,
  type PositionUpdate,
} from "@/lib/habits";

// Query keys
export const habitsKeys = {
  all: ["habits"] as const,
  lists: () => [...habitsKeys.all, "list"] as const,
  list: (familyId: number) => [...habitsKeys.lists(), familyId] as const,
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

// Create habit mutation
export function useCreateHabit(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHabitData) => createHabit(familyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.list(familyId) });
    },
  });
}

// Update habit mutation
export function useUpdateHabit(familyId: number, habitId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateHabitData) => updateHabit(familyId, habitId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.list(familyId) });
    },
  });
}

// Delete habit mutation
export function useDeleteHabit(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habitId: number) => deleteHabit(familyId, habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.list(familyId) });
    },
  });
}

// Update positions mutation
export function useUpdateHabitPositions(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (positions: PositionUpdate[]) =>
      updateHabitPositions(familyId, positions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.list(familyId) });
    },
  });
}
