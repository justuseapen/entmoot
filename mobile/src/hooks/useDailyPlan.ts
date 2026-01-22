import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

// ============================================================================
// Types
// ============================================================================

/** Summary of a user (for assignee display) */
export interface UserSummary {
  id: number;
  name: string;
  avatar_url: string | null;
}

/** Summary of a goal (for linking tasks/priorities to goals) */
export interface GoalSummary {
  id: number;
  title: string;
  time_scale: string;
  status: string;
}

/** A task within a daily plan */
export interface DailyTask {
  id: number;
  title: string;
  completed: boolean;
  position: number;
  goal_id: number | null;
  goal: GoalSummary | null;
  assignee_id: number | null;
  assignee: UserSummary | null;
}

/** A top priority within a daily plan (max 3) */
export interface TopPriority {
  id: number;
  title: string;
  priority_order: number;
  goal_id: number | null;
  goal: GoalSummary | null;
  completed: boolean;
}

/** Habit data nested within habit completion */
export interface HabitInfo {
  id: number;
  name: string;
  position: number;
  is_active: boolean;
}

/** A habit completion record for the daily plan */
export interface HabitCompletion {
  id: number;
  habit_id: number;
  daily_plan_id: number;
  completed: boolean;
  habit: HabitInfo;
}

/** Completion statistics for the daily plan */
export interface CompletionStats {
  tasks_total: number;
  tasks_completed: number;
  priorities_total: number;
  priorities_completed: number;
  habits_total: number;
  habits_completed: number;
}

/** The full daily plan response from the API */
export interface DailyPlan {
  id: number;
  date: string;
  intention: string | null;
  shutdown_shipped: string | null;
  shutdown_blocked: string | null;
  user_id: number;
  family_id: number;
  completion_stats: CompletionStats;
  created_at: string;
  updated_at: string;
  daily_tasks: DailyTask[];
  top_priorities: TopPriority[];
  yesterday_incomplete_tasks: DailyTask[];
  habit_completions: HabitCompletion[];
}

// ============================================================================
// Nested Attributes Types (for updates)
// ============================================================================

/** Attributes for creating/updating a daily task */
export interface DailyTaskAttributes {
  id?: number;
  title?: string;
  completed?: boolean;
  position?: number;
  goal_id?: number | null;
  assignee_id?: number | null;
  _destroy?: boolean;
}

/** Attributes for creating/updating a top priority */
export interface TopPriorityAttributes {
  id?: number;
  title?: string;
  priority_order?: number;
  goal_id?: number | null;
  completed?: boolean;
  _destroy?: boolean;
}

/** Attributes for updating a habit completion */
export interface HabitCompletionAttributes {
  id?: number;
  habit_id?: number;
  completed?: boolean;
}

/** Payload for updating a daily plan */
export interface UpdateDailyPlanPayload {
  daily_plan: {
    intention?: string | null;
    shutdown_shipped?: string | null;
    shutdown_blocked?: string | null;
    daily_tasks_attributes?: DailyTaskAttributes[];
    top_priorities_attributes?: TopPriorityAttributes[];
    habit_completions_attributes?: HabitCompletionAttributes[];
  };
}

/** Response from updating a daily plan */
export interface UpdateDailyPlanResponse {
  message: string;
  daily_plan: DailyPlan;
  is_first_action: boolean;
}

// ============================================================================
// Query Keys
// ============================================================================

export const dailyPlanKeys = {
  all: ["dailyPlans"] as const,
  today: (familyId: number) => [...dailyPlanKeys.all, "today", familyId] as const,
  detail: (familyId: number, planId: number) =>
    [...dailyPlanKeys.all, "detail", familyId, planId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch today's daily plan for the current family.
 * Creates the plan if it doesn't exist.
 */
export function useTodayPlan() {
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useQuery({
    queryKey: dailyPlanKeys.today(currentFamilyId ?? 0),
    queryFn: async () => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      return api.get<DailyPlan>(`/families/${currentFamilyId}/daily_plans/today`);
    },
    enabled: !!currentFamilyId,
  });
}

/**
 * Hook to update a daily plan with nested attributes support.
 * Supports optimistic updates for task/habit completion toggles.
 */
export function useUpdateDailyPlan() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async ({
      planId,
      payload,
    }: {
      planId: number;
      payload: UpdateDailyPlanPayload;
    }) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      return api.patch<UpdateDailyPlanResponse>(
        `/families/${currentFamilyId}/daily_plans/${planId}`,
        payload
      );
    },
    onMutate: async ({ planId, payload }) => {
      if (!currentFamilyId) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: dailyPlanKeys.today(currentFamilyId),
      });

      // Snapshot the previous value
      const previousPlan = queryClient.getQueryData<DailyPlan>(
        dailyPlanKeys.today(currentFamilyId)
      );

      // Optimistically update the cache
      if (previousPlan && previousPlan.id === planId) {
        const updatedPlan = applyOptimisticUpdate(previousPlan, payload);
        queryClient.setQueryData(
          dailyPlanKeys.today(currentFamilyId),
          updatedPlan
        );
      }

      return { previousPlan };
    },
    onError: (_error, _variables, context) => {
      // Rollback to the previous value on error
      if (context?.previousPlan && currentFamilyId) {
        queryClient.setQueryData(
          dailyPlanKeys.today(currentFamilyId),
          context.previousPlan
        );
      }
    },
    onSuccess: (data) => {
      // Update the cache with the server response
      if (currentFamilyId) {
        queryClient.setQueryData(
          dailyPlanKeys.today(currentFamilyId),
          data.daily_plan
        );
      }
    },
    onSettled: () => {
      // Invalidate to ensure we have the latest data
      if (currentFamilyId) {
        queryClient.invalidateQueries({
          queryKey: dailyPlanKeys.today(currentFamilyId),
        });
      }
    },
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Applies optimistic updates to the daily plan based on the payload.
 * This enables immediate UI feedback before the server responds.
 */
function applyOptimisticUpdate(
  plan: DailyPlan,
  payload: UpdateDailyPlanPayload
): DailyPlan {
  const updates = payload.daily_plan;
  const updatedPlan = { ...plan };

  // Update simple fields
  if (updates.intention !== undefined) {
    updatedPlan.intention = updates.intention;
  }
  if (updates.shutdown_shipped !== undefined) {
    updatedPlan.shutdown_shipped = updates.shutdown_shipped;
  }
  if (updates.shutdown_blocked !== undefined) {
    updatedPlan.shutdown_blocked = updates.shutdown_blocked;
  }

  // Update daily tasks
  if (updates.daily_tasks_attributes) {
    updatedPlan.daily_tasks = applyTasksUpdate(
      plan.daily_tasks,
      updates.daily_tasks_attributes
    );
    // Update completion stats
    updatedPlan.completion_stats = {
      ...plan.completion_stats,
      tasks_total: updatedPlan.daily_tasks.length,
      tasks_completed: updatedPlan.daily_tasks.filter((t) => t.completed).length,
    };
  }

  // Update top priorities
  if (updates.top_priorities_attributes) {
    updatedPlan.top_priorities = applyPrioritiesUpdate(
      plan.top_priorities,
      updates.top_priorities_attributes
    );
    // Update completion stats
    updatedPlan.completion_stats = {
      ...updatedPlan.completion_stats,
      priorities_total: updatedPlan.top_priorities.length,
      priorities_completed: updatedPlan.top_priorities.filter((p) => p.completed)
        .length,
    };
  }

  // Update habit completions
  if (updates.habit_completions_attributes) {
    updatedPlan.habit_completions = applyHabitCompletionsUpdate(
      plan.habit_completions,
      updates.habit_completions_attributes
    );
    // Update completion stats
    updatedPlan.completion_stats = {
      ...updatedPlan.completion_stats,
      habits_total: updatedPlan.habit_completions.length,
      habits_completed: updatedPlan.habit_completions.filter((h) => h.completed)
        .length,
    };
  }

  return updatedPlan;
}

/**
 * Applies updates to daily tasks array.
 */
function applyTasksUpdate(
  tasks: DailyTask[],
  updates: DailyTaskAttributes[]
): DailyTask[] {
  let result = [...tasks];

  for (const update of updates) {
    if (update._destroy && update.id) {
      // Remove the task
      result = result.filter((t) => t.id !== update.id);
    } else if (update.id) {
      // Update existing task
      result = result.map((t) =>
        t.id === update.id
          ? {
              ...t,
              title: update.title ?? t.title,
              completed: update.completed ?? t.completed,
              position: update.position ?? t.position,
              goal_id: update.goal_id !== undefined ? update.goal_id : t.goal_id,
              assignee_id:
                update.assignee_id !== undefined
                  ? update.assignee_id
                  : t.assignee_id,
            }
          : t
      );
    } else if (update.title) {
      // Add new task (temporary ID will be replaced by server response)
      const newTask: DailyTask = {
        id: Date.now(), // Temporary ID
        title: update.title,
        completed: update.completed ?? false,
        position: update.position ?? result.length,
        goal_id: update.goal_id ?? null,
        goal: null,
        assignee_id: update.assignee_id ?? null,
        assignee: null,
      };
      result.push(newTask);
    }
  }

  return result;
}

/**
 * Applies updates to top priorities array.
 */
function applyPrioritiesUpdate(
  priorities: TopPriority[],
  updates: TopPriorityAttributes[]
): TopPriority[] {
  let result = [...priorities];

  for (const update of updates) {
    if (update._destroy && update.id) {
      // Remove the priority
      result = result.filter((p) => p.id !== update.id);
    } else if (update.id) {
      // Update existing priority
      result = result.map((p) =>
        p.id === update.id
          ? {
              ...p,
              title: update.title ?? p.title,
              completed: update.completed ?? p.completed,
              priority_order: update.priority_order ?? p.priority_order,
              goal_id: update.goal_id !== undefined ? update.goal_id : p.goal_id,
            }
          : p
      );
    } else if (update.title) {
      // Add new priority (temporary ID will be replaced by server response)
      const newPriority: TopPriority = {
        id: Date.now(), // Temporary ID
        title: update.title,
        priority_order: update.priority_order ?? result.length,
        goal_id: update.goal_id ?? null,
        goal: null,
        completed: update.completed ?? false,
      };
      result.push(newPriority);
    }
  }

  return result;
}

/**
 * Applies updates to habit completions array.
 */
function applyHabitCompletionsUpdate(
  completions: HabitCompletion[],
  updates: HabitCompletionAttributes[]
): HabitCompletion[] {
  let result = [...completions];

  for (const update of updates) {
    if (update.id) {
      // Update existing habit completion
      result = result.map((hc) =>
        hc.id === update.id
          ? {
              ...hc,
              completed: update.completed ?? hc.completed,
            }
          : hc
      );
    }
  }

  return result;
}
