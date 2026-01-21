import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getCurrentQuarterlyReview,
  getQuarterlyReviews,
  getQuarterlyReview,
  updateQuarterlyReview,
  getQuarterlyReviewMetrics,
  type UpdateQuarterlyReviewData,
  type QuarterlyReviewFilters,
} from "@/lib/quarterlyReviews";

// Query keys
export const quarterlyReviewKeys = {
  all: ["quarterlyReviews"] as const,
  lists: () => [...quarterlyReviewKeys.all, "list"] as const,
  list: (familyId: number, filters?: QuarterlyReviewFilters) =>
    [...quarterlyReviewKeys.lists(), familyId, filters] as const,
  current: (familyId: number) =>
    [...quarterlyReviewKeys.all, "current", familyId] as const,
  details: () => [...quarterlyReviewKeys.all, "detail"] as const,
  detail: (familyId: number, reviewId: number) =>
    [...quarterlyReviewKeys.details(), familyId, reviewId] as const,
  metrics: (familyId: number, reviewId: number) =>
    [...quarterlyReviewKeys.all, "metrics", familyId, reviewId] as const,
};

// Get current quarter's review (creates if not exists)
export function useCurrentQuarterlyReview(familyId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: quarterlyReviewKeys.current(familyId),
    queryFn: () => getCurrentQuarterlyReview(familyId),
    enabled: isAuthenticated && !!familyId,
  });
}

// Get all quarterly reviews for the user
export function useQuarterlyReviews(
  familyId: number,
  filters?: QuarterlyReviewFilters
) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: quarterlyReviewKeys.list(familyId, filters),
    queryFn: () => getQuarterlyReviews(familyId, filters),
    enabled: isAuthenticated && !!familyId,
  });
}

// Get a single quarterly review
export function useQuarterlyReview(familyId: number, reviewId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: quarterlyReviewKeys.detail(familyId, reviewId),
    queryFn: () => getQuarterlyReview(familyId, reviewId),
    enabled: isAuthenticated && !!familyId && !!reviewId,
  });
}

// Get metrics for a quarterly review
export function useQuarterlyReviewMetrics(familyId: number, reviewId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: quarterlyReviewKeys.metrics(familyId, reviewId),
    queryFn: () => getQuarterlyReviewMetrics(familyId, reviewId),
    enabled: isAuthenticated && !!familyId && !!reviewId,
  });
}

// Update a quarterly review
export function useUpdateQuarterlyReview(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: number;
      data: UpdateQuarterlyReviewData;
    }) => updateQuarterlyReview(familyId, reviewId, data),
    onSuccess: (response, { reviewId }) => {
      // Update the current review cache
      if (response.quarterly_review) {
        queryClient.setQueryData(
          quarterlyReviewKeys.current(familyId),
          response.quarterly_review
        );
        queryClient.setQueryData(
          quarterlyReviewKeys.detail(familyId, reviewId),
          response.quarterly_review
        );
      }
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: quarterlyReviewKeys.lists(),
      });
    },
  });
}
