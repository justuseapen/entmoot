import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getCurrentWeeklyReview,
  getWeeklyReviews,
  getWeeklyReview,
  updateWeeklyReview,
  getWeeklyReviewMetrics,
  type UpdateWeeklyReviewData,
  type WeeklyReviewFilters,
} from "@/lib/weeklyReviews";

// Query keys
export const weeklyReviewKeys = {
  all: ["weeklyReviews"] as const,
  lists: () => [...weeklyReviewKeys.all, "list"] as const,
  list: (familyId: number, filters?: WeeklyReviewFilters) =>
    [...weeklyReviewKeys.lists(), familyId, filters] as const,
  current: (familyId: number) =>
    [...weeklyReviewKeys.all, "current", familyId] as const,
  details: () => [...weeklyReviewKeys.all, "detail"] as const,
  detail: (familyId: number, reviewId: number) =>
    [...weeklyReviewKeys.details(), familyId, reviewId] as const,
  metrics: (familyId: number, reviewId: number) =>
    [...weeklyReviewKeys.all, "metrics", familyId, reviewId] as const,
};

// Get current week's review (creates if not exists)
export function useCurrentWeeklyReview(familyId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: weeklyReviewKeys.current(familyId),
    queryFn: () => getCurrentWeeklyReview(familyId),
    enabled: isAuthenticated && !!familyId,
  });
}

// Get all weekly reviews for the user
export function useWeeklyReviews(
  familyId: number,
  filters?: WeeklyReviewFilters
) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: weeklyReviewKeys.list(familyId, filters),
    queryFn: () => getWeeklyReviews(familyId, filters),
    enabled: isAuthenticated && !!familyId,
  });
}

// Get a single weekly review
export function useWeeklyReview(familyId: number, reviewId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: weeklyReviewKeys.detail(familyId, reviewId),
    queryFn: () => getWeeklyReview(familyId, reviewId),
    enabled: isAuthenticated && !!familyId && !!reviewId,
  });
}

// Get metrics for a weekly review
export function useWeeklyReviewMetrics(familyId: number, reviewId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: weeklyReviewKeys.metrics(familyId, reviewId),
    queryFn: () => getWeeklyReviewMetrics(familyId, reviewId),
    enabled: isAuthenticated && !!familyId && !!reviewId,
  });
}

// Update a weekly review
export function useUpdateWeeklyReview(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: number;
      data: UpdateWeeklyReviewData;
    }) => updateWeeklyReview(familyId, reviewId, data),
    onSuccess: (response, { reviewId }) => {
      // Update the current review cache
      if (response.weekly_review) {
        queryClient.setQueryData(
          weeklyReviewKeys.current(familyId),
          response.weekly_review
        );
        queryClient.setQueryData(
          weeklyReviewKeys.detail(familyId, reviewId),
          response.weekly_review
        );
      }
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: weeklyReviewKeys.lists(),
      });
    },
  });
}
