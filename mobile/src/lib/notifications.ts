import { authFetch } from "./api";
import type { Notification } from "@shared/types";

// Notification types
export type NotificationType =
  | "general"
  | "reminder"
  | "goal_update"
  | "family_invite"
  | "badge_earned"
  | "streak_milestone";

// Response from notifications endpoint
export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

// Get notifications
export async function getNotifications(
  limit?: number
): Promise<NotificationsResponse> {
  const params = limit ? `?limit=${limit}` : "";
  return authFetch<NotificationsResponse>(`/notifications${params}`);
}

// Mark a single notification as read
export async function markNotificationAsRead(
  notificationId: number
): Promise<{ notification: Notification }> {
  return authFetch<{ notification: Notification }>(
    `/notifications/${notificationId}/mark_as_read`,
    { method: "POST" }
  );
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  message: string;
}> {
  return authFetch<{ success: boolean; message: string }>(
    "/notifications/mark_all_as_read",
    { method: "POST" }
  );
}

// Helper to get notification icon based on type
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "reminder":
      return "🔔";
    case "goal_update":
      return "🎯";
    case "family_invite":
      return "👨‍👩‍👧‍👦";
    case "badge_earned":
      return "🏆";
    case "streak_milestone":
      return "🔥";
    default:
      return "📬";
  }
}

// Helper to format notification time
export function formatNotificationTime(createdAt: string): string {
  const now = new Date();
  const date = new Date(createdAt);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}
