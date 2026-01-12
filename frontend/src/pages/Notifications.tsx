import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/hooks/useNotifications";
import {
  getNotificationIcon,
  formatNotificationTime,
  type Notification,
} from "@/lib/notifications";

export function NotificationsPage() {
  const navigate = useNavigate();
  // Fetch more notifications for the full page
  const { data, isLoading } = useNotifications(50);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    // Navigate to link if present
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead.mutate();
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "All caught up!"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Bell className="mb-3 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">No notifications yet</p>
                <p className="mt-1 text-sm">
                  We&apos;ll notify you when something important happens.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => markAsRead.mutate(notification.id)}
                    isMarking={markAsRead.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface NotificationRowProps {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: () => void;
  isMarking: boolean;
}

function NotificationRow({
  notification,
  onClick,
  onMarkAsRead,
  isMarking,
}: NotificationRowProps) {
  const icon = getNotificationIcon(notification.notification_type);
  const timeAgo = formatNotificationTime(notification.created_at);

  return (
    <div
      className={`flex items-start gap-4 px-6 py-4 transition-colors ${
        !notification.read ? "bg-blue-50/50" : ""
      }`}
    >
      <button
        className="flex flex-1 items-start gap-4 text-left hover:opacity-80"
        onClick={onClick}
      >
        <span className="flex-shrink-0 text-2xl">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm ${!notification.read ? "font-semibold" : "font-medium"}`}
            >
              {notification.title}
            </p>
            <span className="flex-shrink-0 text-xs text-gray-400">
              {timeAgo}
            </span>
          </div>
          {notification.body && (
            <p className="mt-1 text-sm text-gray-600">{notification.body}</p>
          )}
          {notification.link && (
            <p className="mt-2 text-xs text-blue-600 hover:underline">
              Click to view details
            </p>
          )}
        </div>
      </button>
      {!notification.read && (
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead();
          }}
          disabled={isMarking}
          title="Mark as read"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
