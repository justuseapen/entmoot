import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getCurrentMonthlyReview,
  getMonthlyReviews,
  getMonthlyReview,
  updateMonthlyReview,
  getMonthlyReviewMetrics,
  type UpdateMonthlyReviewData,
  type MonthlyReviewFilters,
} from "@/lib/monthlyReviews";

// Query keys
export const monthlyReviewKeys = {
  all: ["monthlyReviews"] as const,
  lists: () => [...monthlyReviewKeys.all, "list"] as const,
  list: (familyId: number, filters?: MonthlyReviewFilters) =>
    [...monthlyReviewKeys.lists(), familyId, filters] as const,
  current: (familyId: number) =>
    [...monthlyReviewKeys.all, "current", familyId] as const,
  details: () => [...monthlyReviewKeys.all, "detail"] as const,
  detail: (familyId: number, reviewId: number) =>
    [...monthlyReviewKeys.details(), familyId, reviewId] as const,
  metrics: (familyId: number, reviewId: number) =>
    [...monthlyReviewKeys.all, "metrics", familyId, reviewId] as const,
};

// Get current month's review (creates if not exists)
export function useCurrentMonthlyReview(familyId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: monthlyReviewKeys.current(familyId),
    queryFn: () => getCurrentMonthlyReview(familyId),
    enabled: isAuthenticated && !!familyId,
  });
}

// Get all monthly reviews for the user
export function useMonthlyReviews(
  familyId: number,
  filters?: MonthlyReviewFilters
) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: monthlyReviewKeys.list(familyId, filters),
    queryFn: () => getMonthlyReviews(familyId, filters),
    enabled: isAuthenticated && !!familyId,
  });
}

// Get a single monthly review
export function useMonthlyReview(familyId: number, reviewId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: monthlyReviewKeys.detail(familyId, reviewId),
    queryFn: () => getMonthlyReview(familyId, reviewId),
    enabled: isAuthenticated && !!familyId && !!reviewId,
  });
}

// Get metrics for a monthly review
export function useMonthlyReviewMetrics(familyId: number, reviewId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: monthlyReviewKeys.metrics(familyId, reviewId),
    queryFn: () => getMonthlyReviewMetrics(familyId, reviewId),
    enabled: isAuthenticated && !!familyId && !!reviewId,
  });
}

// Update a monthly review
export function useUpdateMonthlyReview(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: number;
      data: UpdateMonthlyReviewData;
    }) => updateMonthlyReview(familyId, reviewId, data),
    onSuccess: (response, { reviewId }) => {
      // Update the current review cache
      if (response.monthly_review) {
        queryClient.setQueryData(
          monthlyReviewKeys.current(familyId),
          response.monthly_review
        );
        queryClient.setQueryData(
          monthlyReviewKeys.detail(familyId, reviewId),
          response.monthly_review
        );
      }
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: monthlyReviewKeys.lists(),
      });
    },
  });
}
