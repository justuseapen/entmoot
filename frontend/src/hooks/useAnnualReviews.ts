import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getCurrentAnnualReview,
  getAnnualReviews,
  getAnnualReview,
  updateAnnualReview,
  getAnnualReviewMetrics,
  type UpdateAnnualReviewData,
} from "@/lib/annualReviews";

// Query keys
export const annualReviewKeys = {
  all: ["annualReviews"] as const,
  lists: () => [...annualReviewKeys.all, "list"] as const,
  list: (familyId: number) => [...annualReviewKeys.lists(), familyId] as const,
  current: (familyId: number) =>
    [...annualReviewKeys.all, "current", familyId] as const,
  details: () => [...annualReviewKeys.all, "detail"] as const,
  detail: (familyId: number, reviewId: number) =>
    [...annualReviewKeys.details(), familyId, reviewId] as const,
  metrics: (familyId: number, reviewId: number) =>
    [...annualReviewKeys.all, "metrics", familyId, reviewId] as const,
};

// Get current year's review (creates if not exists)
export function useCurrentAnnualReview(familyId: number) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: annualReviewKeys.current(familyId),
    queryFn: () => getCurrentAnnualReview(familyId, token!),
    enabled: !!token && !!familyId,
  });
}

// Get all annual reviews for the user
export function useAnnualReviews(familyId: number) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: annualReviewKeys.list(familyId),
    queryFn: () => getAnnualReviews(familyId, token!),
    enabled: !!token && !!familyId,
  });
}

// Get a single annual review
export function useAnnualReview(familyId: number, reviewId: number) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: annualReviewKeys.detail(familyId, reviewId),
    queryFn: () => getAnnualReview(familyId, reviewId, token!),
    enabled: !!token && !!familyId && !!reviewId,
  });
}

// Get metrics for an annual review
export function useAnnualReviewMetrics(familyId: number, reviewId: number) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: annualReviewKeys.metrics(familyId, reviewId),
    queryFn: () => getAnnualReviewMetrics(familyId, reviewId, token!),
    enabled: !!token && !!familyId && !!reviewId,
  });
}

// Update an annual review
export function useUpdateAnnualReview(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: number;
      data: UpdateAnnualReviewData;
    }) => updateAnnualReview(familyId, reviewId, data, token!),
    onSuccess: (response, { reviewId }) => {
      // Update the current review cache
      if (response.annual_review) {
        queryClient.setQueryData(
          annualReviewKeys.current(familyId),
          response.annual_review
        );
        queryClient.setQueryData(
          annualReviewKeys.detail(familyId, reviewId),
          response.annual_review
        );
      }
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: annualReviewKeys.lists(),
      });
    },
  });
}
