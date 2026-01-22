import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

// ============================================================================
// Types
// ============================================================================

/** Task completion metrics from the weekly review */
export interface TaskCompletionMetrics {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  days_with_plans: number;
}

/** Goal progress metrics from the weekly review */
export interface GoalProgressMetrics {
  total_goals: number;
  completed_goals: number;
  in_progress_goals: number;
  at_risk_goals: number;
  average_progress: number;
}

/** Combined metrics from the weekly review */
export interface WeeklyReviewMetrics {
  task_completion: TaskCompletionMetrics;
  goal_progress: GoalProgressMetrics;
}

/** Habit tally - habit name to completion count */
export type HabitTally = Record<string, number>;

/** Daily plan summary for the weekly review */
export interface DailyPlanSummary {
  id: number;
  date: string;
}

/** A weekly review from the API */
export interface WeeklyReview {
  id: number;
  week_start_date: string;
  user_id: number;
  family_id: number;
  created_at: string;
  updated_at: string;

  // Legacy fields (arrays)
  wins: string[];
  challenges: string[];
  next_week_priorities: string[];
  lessons_learned: string | null;
  completed: boolean;

  // Review section
  source_review_completed: boolean | null;
  wins_shipped: string | null;
  losses_friction: string | null;

  // Metrics section
  workouts_completed: number | null;
  workouts_planned: number | null;
  walks_completed: number | null;
  walks_planned: number | null;
  writing_sessions_completed: number | null;
  writing_sessions_planned: number | null;
  house_resets_completed: number | null;
  house_resets_planned: number | null;
  meals_prepped_held: boolean | null;
  metrics_notes: string | null;

  // System health
  daily_focus_used_every_day: boolean | null;
  weekly_priorities_clear: boolean | null;
  cleaning_system_held: boolean | null;
  training_volume_sustainable: boolean | null;
  system_to_adjust: string | null;
  weekly_priorities: string | null;
  kill_list: string | null;

  // Forward setup
  workouts_blocked: boolean | null;
  monday_top_3_decided: boolean | null;
  monday_focus_card_prepped: boolean | null;

  // Computed data (from API)
  metrics?: WeeklyReviewMetrics;
  daily_plans: DailyPlanSummary[];
  habit_tally?: HabitTally;
}

/** Payload for updating a weekly review */
export interface UpdateWeeklyReviewPayload {
  // Legacy fields
  wins?: string[];
  challenges?: string[];
  next_week_priorities?: string[];
  lessons_learned?: string | null;
  completed?: boolean;

  // Review section
  source_review_completed?: boolean;
  wins_shipped?: string | null;
  losses_friction?: string | null;

  // Metrics section
  workouts_completed?: number | null;
  workouts_planned?: number | null;
  walks_completed?: number | null;
  walks_planned?: number | null;
  writing_sessions_completed?: number | null;
  writing_sessions_planned?: number | null;
  house_resets_completed?: number | null;
  house_resets_planned?: number | null;
  meals_prepped_held?: boolean;
  metrics_notes?: string | null;

  // System health
  daily_focus_used_every_day?: boolean;
  weekly_priorities_clear?: boolean;
  cleaning_system_held?: boolean;
  training_volume_sustainable?: boolean;
  system_to_adjust?: string | null;
  weekly_priorities?: string | null;
  kill_list?: string | null;

  // Forward setup
  workouts_blocked?: boolean;
  monday_top_3_decided?: boolean;
  monday_focus_card_prepped?: boolean;
}

/** Response from update weekly review endpoint */
export interface UpdateWeeklyReviewResponse {
  message: string;
  weekly_review: WeeklyReview;
}

// ============================================================================
// Query Keys
// ============================================================================

export const weeklyReviewsKeys = {
  all: ["weeklyReviews"] as const,
  current: (familyId: number) =>
    [...weeklyReviewsKeys.all, "current", familyId] as const,
  detail: (familyId: number, reviewId: number) =>
    [...weeklyReviewsKeys.all, "detail", familyId, reviewId] as const,
  list: (familyId: number) =>
    [...weeklyReviewsKeys.all, "list", familyId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch the current week's weekly review.
 * Creates a new review if one doesn't exist for the current week.
 */
export function useCurrentWeeklyReview() {
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useQuery({
    queryKey: weeklyReviewsKeys.current(currentFamilyId ?? 0),
    queryFn: async () => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      const response = await api.get<WeeklyReview>(
        `/families/${currentFamilyId}/weekly_reviews/current`
      );
      return response;
    },
    enabled: !!currentFamilyId,
  });
}

/**
 * Hook to fetch all weekly reviews for the current family.
 */
export function useWeeklyReviews() {
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useQuery({
    queryKey: weeklyReviewsKeys.list(currentFamilyId ?? 0),
    queryFn: async () => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      const response = await api.get<{ weekly_reviews: WeeklyReview[] }>(
        `/families/${currentFamilyId}/weekly_reviews`
      );
      return response.weekly_reviews;
    },
    enabled: !!currentFamilyId,
  });
}

/**
 * Hook to fetch a specific weekly review by ID.
 */
export function useWeeklyReview(reviewId: number) {
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useQuery({
    queryKey: weeklyReviewsKeys.detail(currentFamilyId ?? 0, reviewId),
    queryFn: async () => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      const response = await api.get<WeeklyReview>(
        `/families/${currentFamilyId}/weekly_reviews/${reviewId}`
      );
      return response;
    },
    enabled: !!currentFamilyId && !!reviewId,
  });
}

/**
 * Hook to update a weekly review.
 * Invalidates relevant queries on success.
 */
export function useUpdateWeeklyReview() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async ({
      reviewId,
      payload,
    }: {
      reviewId: number;
      payload: UpdateWeeklyReviewPayload;
    }) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      return api.patch<UpdateWeeklyReviewResponse>(
        `/families/${currentFamilyId}/weekly_reviews/${reviewId}`,
        { weekly_review: payload }
      );
    },
    onSuccess: (data) => {
      if (currentFamilyId) {
        // Update the current weekly review cache
        queryClient.setQueryData(
          weeklyReviewsKeys.current(currentFamilyId),
          data.weekly_review
        );
        // Update the detail cache
        queryClient.setQueryData(
          weeklyReviewsKeys.detail(currentFamilyId, data.weekly_review.id),
          data.weekly_review
        );
      }
      // Invalidate the list to reflect any changes
      queryClient.invalidateQueries({ queryKey: weeklyReviewsKeys.all });
    },
  });
}
