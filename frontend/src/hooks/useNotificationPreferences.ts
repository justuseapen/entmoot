import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type UpdateNotificationPreferencesData,
} from "@/lib/notificationPreferences";

// Query keys
export const notificationPreferencesKeys = {
  all: ["notificationPreferences"] as const,
  detail: () => [...notificationPreferencesKeys.all, "detail"] as const,
};

// Get notification preferences
export function useNotificationPreferences() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: notificationPreferencesKeys.detail(),
    queryFn: () => getNotificationPreferences(),
    enabled: isAuthenticated,
  });
}

// Update notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateNotificationPreferencesData) =>
      updateNotificationPreferences(data),
    onSuccess: (response) => {
      // Update the cache with the new preferences
      queryClient.setQueryData(notificationPreferencesKeys.detail(), response);
    },
  });
}
