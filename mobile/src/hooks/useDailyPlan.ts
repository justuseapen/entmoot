import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import {
  setCache,
  getCache,
  setCacheWithTimestamp,
  getCacheWithTimestamp,
  CACHE_KEYS,
} from "@/services/offlineStorage";
import { addToQueue, getQueue } from "@/services/syncQueue";
import { checkIsOnline } from "@/hooks/useNetworkStatus";
import { Alert } from "react-native";

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
  today: (familyId: number) =>
    [...dailyPlanKeys.all, "today", familyId] as const,
  detail: (familyId: number, planId: number) =>
    [...dailyPlanKeys.all, "detail", familyId, planId] as const,
};

// ============================================================================
// Offline Cache Keys
// ============================================================================

/**
 * Get the cache key for a family's daily plan
 */
function getDailyPlanCacheKey(familyId: number): string {
  return `${CACHE_KEYS.DAILY_PLAN}:${familyId}`;
}

/**
 * Get the cache key for pending sync items
 */
const PENDING_SYNC_KEY = "pending_sync:daily_plan";

/**
 * Tracks items pending sync for visual indicator
 */
export interface PendingSyncItem {
  /** Unique ID (task id, priority id, habit completion id, or 'intention') */
  itemId: string | number;
  /** Type of item */
  itemType: "task" | "priority" | "habit" | "intention" | "shutdown";
  /** When the change was made */
  timestamp: number;
}

/**
 * Get pending sync items from storage
 */
export function getPendingSyncItems(): PendingSyncItem[] {
  return getCache<PendingSyncItem[]>(PENDING_SYNC_KEY) ?? [];
}

/**
 * Add a pending sync item
 */
function addPendingSyncItem(item: Omit<PendingSyncItem, "timestamp">): void {
  const items = getPendingSyncItems();
  // Remove any existing item with same id and type
  const filtered = items.filter(
    (i) => !(i.itemId === item.itemId && i.itemType === item.itemType)
  );
  filtered.push({ ...item, timestamp: Date.now() });
  setCache(PENDING_SYNC_KEY, filtered);
}

/**
 * Remove a pending sync item
 */
function removePendingSyncItem(
  itemId: string | number,
  itemType: PendingSyncItem["itemType"]
): void {
  const items = getPendingSyncItems();
  const filtered = items.filter(
    (i) => !(i.itemId === itemId && i.itemType === itemType)
  );
  setCache(PENDING_SYNC_KEY, filtered);
}

/**
 * Clear all pending sync items for a daily plan
 */
export function clearPendingSyncItems(): void {
  setCache(PENDING_SYNC_KEY, []);
}

/**
 * Check if a specific item is pending sync
 */
export function isPendingSync(
  itemId: string | number,
  itemType: PendingSyncItem["itemType"]
): boolean {
  const items = getPendingSyncItems();
  return items.some((i) => i.itemId === itemId && i.itemType === itemType);
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch today's daily plan for the current family.
 * Creates the plan if it doesn't exist.
 * Supports offline mode with MMKV caching.
 */
export function useTodayPlan() {
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useQuery({
    queryKey: dailyPlanKeys.today(currentFamilyId ?? 0),
    queryFn: async () => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }

      // Check if we're online
      const isOnline = await checkIsOnline();

      if (isOnline) {
        try {
          const data = await api.get<DailyPlan>(
            `/families/${currentFamilyId}/daily_plans/today`
          );
          // Cache the response for offline use
          setCacheWithTimestamp(getDailyPlanCacheKey(currentFamilyId), data);
          return data;
        } catch (error) {
          // On network error, try to return cached data
          const cached = getCacheWithTimestamp<DailyPlan>(
            getDailyPlanCacheKey(currentFamilyId)
          );
          if (cached) {
            console.log("[useTodayPlan] Network error, using cached data");
            return cached.data;
          }
          throw error;
        }
      } else {
        // Offline - return cached data
        const cached = getCacheWithTimestamp<DailyPlan>(
          getDailyPlanCacheKey(currentFamilyId)
        );
        if (cached) {
          console.log("[useTodayPlan] Offline, using cached data");
          return cached.data;
        }
        throw new Error("No cached data available while offline");
      }
    },
    enabled: !!currentFamilyId,
    // Use initialData from cache for instant display
    initialData: () => {
      if (!currentFamilyId) return undefined;
      const cached = getCacheWithTimestamp<DailyPlan>(
        getDailyPlanCacheKey(currentFamilyId)
      );
      return cached?.data;
    },
    // Consider cached data stale after 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to update a daily plan with nested attributes support.
 * Supports optimistic updates for task/habit completion toggles.
 * When offline, queues changes for sync when back online.
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

      // Check if we're online
      const isOnline = await checkIsOnline();

      if (isOnline) {
        // Online - make the API call directly
        return api.patch<UpdateDailyPlanResponse>(
          `/families/${currentFamilyId}/daily_plans/${planId}`,
          payload
        );
      } else {
        // Offline - add to sync queue and return optimistic response
        const endpoint = `/families/${currentFamilyId}/daily_plans/${planId}`;
        const actionDescription = getActionDescription(payload);

        addToQueue({
          action: `Update daily plan: ${actionDescription}`,
          endpoint,
          method: "PATCH",
          payload,
        });

        // Track pending items for UI indicator
        trackPendingSyncItems(payload);

        // Get current cached plan for building optimistic response
        const currentPlan = queryClient.getQueryData<DailyPlan>(
          dailyPlanKeys.today(currentFamilyId)
        );

        if (currentPlan) {
          // Update the offline cache as well
          const updatedPlan = applyOptimisticUpdate(currentPlan, payload);
          setCacheWithTimestamp(
            getDailyPlanCacheKey(currentFamilyId),
            updatedPlan
          );

          // Return optimistic response
          return {
            message: "Queued for sync",
            daily_plan: updatedPlan,
            is_first_action: false,
          } as UpdateDailyPlanResponse;
        }

        throw new Error("No cached data available for offline update");
      }
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
    onSuccess: async (data) => {
      // Update the cache with the server response
      if (currentFamilyId) {
        queryClient.setQueryData(
          dailyPlanKeys.today(currentFamilyId),
          data.daily_plan
        );

        // Update offline cache too
        setCacheWithTimestamp(
          getDailyPlanCacheKey(currentFamilyId),
          data.daily_plan
        );

        // If we got a real server response (not queued), clear related pending sync items
        if (data.message !== "Queued for sync") {
          clearPendingSyncItems();
        }
      }
    },
    onSettled: async () => {
      // Only invalidate if online
      if (currentFamilyId) {
        const isOnline = await checkIsOnline();
        if (isOnline) {
          queryClient.invalidateQueries({
            queryKey: dailyPlanKeys.today(currentFamilyId),
          });
        }
      }
    },
  });
}

/**
 * Get a human-readable description of the update action
 */
function getActionDescription(payload: UpdateDailyPlanPayload): string {
  const parts: string[] = [];
  const updates = payload.daily_plan;

  if (updates.intention !== undefined) {
    parts.push("intention");
  }
  if (updates.shutdown_shipped !== undefined || updates.shutdown_blocked !== undefined) {
    parts.push("reflection");
  }
  if (updates.daily_tasks_attributes?.length) {
    parts.push(`${updates.daily_tasks_attributes.length} task(s)`);
  }
  if (updates.top_priorities_attributes?.length) {
    parts.push(`${updates.top_priorities_attributes.length} priority(ies)`);
  }
  if (updates.habit_completions_attributes?.length) {
    parts.push(`${updates.habit_completions_attributes.length} habit(s)`);
  }

  return parts.join(", ") || "unknown";
}

/**
 * Track items that need syncing for UI indicators
 */
function trackPendingSyncItems(payload: UpdateDailyPlanPayload): void {
  const updates = payload.daily_plan;

  if (updates.intention !== undefined) {
    addPendingSyncItem({ itemId: "intention", itemType: "intention" });
  }

  if (updates.shutdown_shipped !== undefined || updates.shutdown_blocked !== undefined) {
    addPendingSyncItem({ itemId: "shutdown", itemType: "shutdown" });
  }

  if (updates.daily_tasks_attributes) {
    for (const task of updates.daily_tasks_attributes) {
      if (task.id) {
        addPendingSyncItem({ itemId: task.id, itemType: "task" });
      }
    }
  }

  if (updates.top_priorities_attributes) {
    for (const priority of updates.top_priorities_attributes) {
      if (priority.id) {
        addPendingSyncItem({ itemId: priority.id, itemType: "priority" });
      }
    }
  }

  if (updates.habit_completions_attributes) {
    for (const habit of updates.habit_completions_attributes) {
      if (habit.id) {
        addPendingSyncItem({ itemId: habit.id, itemType: "habit" });
      }
    }
  }
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
      tasks_completed: updatedPlan.daily_tasks.filter((t) => t.completed)
        .length,
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
      priorities_completed: updatedPlan.top_priorities.filter(
        (p) => p.completed
      ).length,
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
              goal_id:
                update.goal_id !== undefined ? update.goal_id : t.goal_id,
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
              goal_id:
                update.goal_id !== undefined ? update.goal_id : p.goal_id,
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

// ============================================================================
// Sync Conflict Handling
// ============================================================================

/**
 * Check if server data is newer than cached data and handle the conflict.
 * Called after sync queue processing to detect and notify user of conflicts.
 * @param serverPlan The plan data from the server
 * @param cachedPlan The locally cached plan data
 * @returns True if conflict was detected (server was newer)
 */
export function checkForConflict(
  serverPlan: DailyPlan,
  cachedPlan: DailyPlan | null
): boolean {
  if (!cachedPlan) return false;

  // Compare updated_at timestamps
  const serverTime = new Date(serverPlan.updated_at).getTime();
  const cachedTime = new Date(cachedPlan.updated_at).getTime();

  // If server is newer by more than 1 second, consider it a conflict
  if (serverTime > cachedTime + 1000) {
    return true;
  }

  return false;
}

/**
 * Hook to refetch and handle conflicts after coming back online.
 * Should be called when network status changes from offline to online.
 */
export function useRefetchOnReconnect() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  const refetchAndCheckConflict = async () => {
    if (!currentFamilyId) return;

    try {
      // Get cached data before refetch
      const cachedPlan = queryClient.getQueryData<DailyPlan>(
        dailyPlanKeys.today(currentFamilyId)
      );

      // Refetch from server
      const serverData = await api.get<DailyPlan>(
        `/families/${currentFamilyId}/daily_plans/today`
      );

      // Check for conflict
      const hasConflict = checkForConflict(serverData, cachedPlan ?? null);

      if (hasConflict) {
        // Show toast/alert about server update
        Alert.alert(
          "Plan Updated",
          "Your daily plan was updated from the server with newer changes.",
          [{ text: "OK" }]
        );
      }

      // Update cache with server data
      queryClient.setQueryData(
        dailyPlanKeys.today(currentFamilyId),
        serverData
      );
      setCacheWithTimestamp(getDailyPlanCacheKey(currentFamilyId), serverData);

      // Clear any pending sync items since we've synced
      clearPendingSyncItems();

      return serverData;
    } catch (error) {
      console.error("[useRefetchOnReconnect] Error refetching:", error);
      throw error;
    }
  };

  return { refetchAndCheckConflict };
}
