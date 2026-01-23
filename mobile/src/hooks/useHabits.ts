import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

// ============================================================================
// Types
// ============================================================================

/** A habit from the API */
export interface Habit {
  id: number;
  name: string;
  position: number;
  is_active: boolean;
}

/** Payload for creating a habit */
export interface CreateHabitPayload {
  habit: {
    name: string;
  };
}

/** Payload for updating a habit */
export interface UpdateHabitPayload {
  habit: {
    name?: string;
    is_active?: boolean;
  };
}

/** Single position update for reordering */
export interface HabitPositionUpdate {
  id: number;
  position: number;
}

/** Payload for reordering habits */
export interface ReorderHabitsPayload {
  positions: HabitPositionUpdate[];
}

/** Response from habits list endpoint */
interface HabitsResponse {
  habits: Habit[];
}

/** Response from habit create/update endpoint */
interface HabitResponse {
  message: string;
  habit: Habit;
}

/** Response from habit delete endpoint */
interface DeleteHabitResponse {
  message: string;
}

/** Response from reorder endpoint */
interface ReorderHabitsResponse {
  message: string;
  habits: Habit[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const habitsKeys = {
  all: ["habits"] as const,
  list: (familyId: number) => [...habitsKeys.all, "list", familyId] as const,
  detail: (familyId: number, habitId: number) =>
    [...habitsKeys.all, "detail", familyId, habitId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch all habits for the current family.
 * Returns active habits ordered by position.
 */
export function useHabits() {
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useQuery({
    queryKey: habitsKeys.list(currentFamilyId ?? 0),
    queryFn: async () => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      const response = await api.get<HabitsResponse>(
        `/families/${currentFamilyId}/habits`
      );
      return response.habits;
    },
    enabled: !!currentFamilyId,
  });
}

/**
 * Hook to create a new habit.
 * Invalidates the habits list on success.
 */
export function useCreateHabit() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async (name: string) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      const payload: CreateHabitPayload = {
        habit: { name },
      };
      return api.post<HabitResponse>(
        `/families/${currentFamilyId}/habits`,
        payload
      );
    },
    onMutate: async (name) => {
      if (!currentFamilyId) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: habitsKeys.list(currentFamilyId),
      });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(
        habitsKeys.list(currentFamilyId)
      );

      // Optimistically add the new habit
      if (previousHabits) {
        const newHabit: Habit = {
          id: Date.now(), // Temporary ID
          name,
          position: previousHabits.length,
          is_active: true,
        };
        queryClient.setQueryData(habitsKeys.list(currentFamilyId), [
          ...previousHabits,
          newHabit,
        ]);
      }

      return { previousHabits };
    },
    onError: (_error, _name, context) => {
      // Rollback on error
      if (context?.previousHabits && currentFamilyId) {
        queryClient.setQueryData(
          habitsKeys.list(currentFamilyId),
          context.previousHabits
        );
      }
    },
    onSettled: () => {
      // Invalidate to ensure we have the latest data
      if (currentFamilyId) {
        queryClient.invalidateQueries({
          queryKey: habitsKeys.list(currentFamilyId),
        });
      }
    },
  });
}

/**
 * Hook to update an existing habit.
 * Supports updating name and is_active status.
 */
export function useUpdateHabit() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async ({
      habitId,
      updates,
    }: {
      habitId: number;
      updates: { name?: string; is_active?: boolean };
    }) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      const payload: UpdateHabitPayload = {
        habit: updates,
      };
      return api.patch<HabitResponse>(
        `/families/${currentFamilyId}/habits/${habitId}`,
        payload
      );
    },
    onMutate: async ({ habitId, updates }) => {
      if (!currentFamilyId) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: habitsKeys.list(currentFamilyId),
      });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(
        habitsKeys.list(currentFamilyId)
      );

      // Optimistically update the habit
      if (previousHabits) {
        const updatedHabits = previousHabits.map((habit) =>
          habit.id === habitId ? { ...habit, ...updates } : habit
        );
        queryClient.setQueryData(
          habitsKeys.list(currentFamilyId),
          updatedHabits
        );
      }

      return { previousHabits };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousHabits && currentFamilyId) {
        queryClient.setQueryData(
          habitsKeys.list(currentFamilyId),
          context.previousHabits
        );
      }
    },
    onSettled: () => {
      // Invalidate to ensure we have the latest data
      if (currentFamilyId) {
        queryClient.invalidateQueries({
          queryKey: habitsKeys.list(currentFamilyId),
        });
      }
    },
  });
}

/**
 * Hook to delete a habit.
 */
export function useDeleteHabit() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async (habitId: number) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      return api.del<DeleteHabitResponse>(
        `/families/${currentFamilyId}/habits/${habitId}`
      );
    },
    onMutate: async (habitId) => {
      if (!currentFamilyId) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: habitsKeys.list(currentFamilyId),
      });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(
        habitsKeys.list(currentFamilyId)
      );

      // Optimistically remove the habit
      if (previousHabits) {
        const updatedHabits = previousHabits.filter(
          (habit) => habit.id !== habitId
        );
        queryClient.setQueryData(
          habitsKeys.list(currentFamilyId),
          updatedHabits
        );
      }

      return { previousHabits };
    },
    onError: (_error, _habitId, context) => {
      // Rollback on error
      if (context?.previousHabits && currentFamilyId) {
        queryClient.setQueryData(
          habitsKeys.list(currentFamilyId),
          context.previousHabits
        );
      }
    },
    onSettled: () => {
      // Invalidate to ensure we have the latest data
      if (currentFamilyId) {
        queryClient.invalidateQueries({
          queryKey: habitsKeys.list(currentFamilyId),
        });
      }
    },
  });
}

/**
 * Hook to reorder habits.
 * Updates positions of multiple habits at once.
 */
export function useReorderHabits() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async (positions: HabitPositionUpdate[]) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      const payload: ReorderHabitsPayload = {
        positions,
      };
      return api.post<ReorderHabitsResponse>(
        `/families/${currentFamilyId}/habits/update_positions`,
        payload
      );
    },
    onMutate: async (positions) => {
      if (!currentFamilyId) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: habitsKeys.list(currentFamilyId),
      });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(
        habitsKeys.list(currentFamilyId)
      );

      // Optimistically update positions
      if (previousHabits) {
        const updatedHabits = [...previousHabits];

        // Apply position updates
        for (const { id, position } of positions) {
          const habitIndex = updatedHabits.findIndex((h) => h.id === id);
          if (habitIndex !== -1) {
            updatedHabits[habitIndex] = {
              ...updatedHabits[habitIndex],
              position,
            };
          }
        }

        // Sort by position
        updatedHabits.sort((a, b) => a.position - b.position);

        queryClient.setQueryData(
          habitsKeys.list(currentFamilyId),
          updatedHabits
        );
      }

      return { previousHabits };
    },
    onError: (_error, _positions, context) => {
      // Rollback on error
      if (context?.previousHabits && currentFamilyId) {
        queryClient.setQueryData(
          habitsKeys.list(currentFamilyId),
          context.previousHabits
        );
      }
    },
    onSuccess: (data) => {
      // Update with server response
      if (currentFamilyId) {
        queryClient.setQueryData(habitsKeys.list(currentFamilyId), data.habits);
      }
    },
    onSettled: () => {
      // Invalidate to ensure we have the latest data
      if (currentFamilyId) {
        queryClient.invalidateQueries({
          queryKey: habitsKeys.list(currentFamilyId),
        });
      }
    },
  });
}
