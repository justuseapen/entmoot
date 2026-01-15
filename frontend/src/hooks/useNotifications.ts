import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationsResponse,
} from "@/lib/notifications";

// Query keys
export const notificationsKeys = {
  all: ["notifications"] as const,
  list: (limit?: number) =>
    [...notificationsKeys.all, "list", { limit }] as const,
};

// Get notifications
export function useNotifications(limit?: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: notificationsKeys.list(limit),
    queryFn: () => getNotifications(limit),
    enabled: isAuthenticated,
    // Refetch every 30 seconds to get new notifications
    refetchInterval: 30000,
    // Keep showing stale data while refetching
    staleTime: 10000,
  });
}

// Mark notification as read
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) =>
      markNotificationAsRead(notificationId),
    onSuccess: (response, notificationId) => {
      // Update the notification in the cache
      queryClient.setQueriesData(
        { queryKey: notificationsKeys.all },
        (oldData: NotificationsResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            notifications: oldData.notifications.map((n) =>
              n.id === notificationId ? response.notification : n
            ),
            unread_count: Math.max(0, oldData.unread_count - 1),
          };
        }
      );
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      // Update all notifications in cache to read
      queryClient.setQueriesData(
        { queryKey: notificationsKeys.all },
        (oldData: NotificationsResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            notifications: oldData.notifications.map((n) => ({
              ...n,
              read: true,
            })),
            unread_count: 0,
          };
        }
      );
    },
  });
}
