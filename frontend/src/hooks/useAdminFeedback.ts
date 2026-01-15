import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getAdminFeedbackList,
  getAdminFeedbackDetail,
  updateAdminFeedback,
} from "@/lib/adminFeedback";
import type {
  AdminFeedbackFilters,
  UpdateFeedbackData,
} from "@/lib/adminFeedback";

// Query key factory
export const adminFeedbackKeys = {
  all: ["admin", "feedback"] as const,
  lists: () => [...adminFeedbackKeys.all, "list"] as const,
  list: (filters: AdminFeedbackFilters) =>
    [...adminFeedbackKeys.lists(), filters] as const,
  details: () => [...adminFeedbackKeys.all, "detail"] as const,
  detail: (id: number) => [...adminFeedbackKeys.details(), id] as const,
};

// Hook to fetch admin feedback list
export function useAdminFeedbackList(filters: AdminFeedbackFilters = {}) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: adminFeedbackKeys.list(filters),
    queryFn: () => getAdminFeedbackList(filters),
    enabled: isAuthenticated,
  });
}

// Hook to fetch single feedback detail
export function useAdminFeedbackDetail(id: number | null) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: adminFeedbackKeys.detail(id!),
    queryFn: () => getAdminFeedbackDetail(id!),
    enabled: isAuthenticated && !!id,
  });
}

// Hook to update feedback
export function useUpdateAdminFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFeedbackData }) =>
      updateAdminFeedback(id, data),
    onSuccess: (response, { id }) => {
      // Update the detail cache
      queryClient.setQueryData(adminFeedbackKeys.detail(id), response);
      // Invalidate list to refresh
      queryClient.invalidateQueries({ queryKey: adminFeedbackKeys.lists() });
    },
  });
}
