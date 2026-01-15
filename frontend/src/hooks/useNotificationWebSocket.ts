import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { notificationsKeys } from "@/hooks/useNotifications";
import type { Notification, NotificationsResponse } from "@/lib/notifications";

interface WebSocketMessage {
  type: "new_notification";
  notification: Notification;
}

export type NotificationCallback = (notification: Notification) => void;

// ActionCable WebSocket hook for real-time notifications
// Note: With session-based auth, WebSocket authentication is handled via cookies
export function useNotificationWebSocket(
  onNotification?: NotificationCallback
) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isAuthenticatedRef = useRef(isAuthenticated);
  const onNotificationRef = useRef(onNotification);

  // Keep refs updated
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up if not authenticated
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    function connect() {
      if (
        !isAuthenticatedRef.current ||
        wsRef.current?.readyState === WebSocket.OPEN
      ) {
        return;
      }

      // Determine WebSocket URL based on environment
      // With session-based auth, the cookie will be sent automatically
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = import.meta.env.DEV
        ? "localhost:3000"
        : window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/cable`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Subscribe to the notifications channel
        const subscribeMessage = {
          command: "subscribe",
          identifier: JSON.stringify({ channel: "NotificationsChannel" }),
        };
        ws.send(JSON.stringify(subscribeMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle different message types
          if (
            data.type === "ping" ||
            data.type === "welcome" ||
            data.type === "confirm_subscription"
          ) {
            return;
          }

          // Handle actual notification messages
          if (data.message) {
            const message = data.message as WebSocketMessage;

            if (message.type === "new_notification") {
              // Update the notifications query cache
              queryClient.setQueriesData(
                { queryKey: notificationsKeys.all },
                (oldData: NotificationsResponse | undefined) => {
                  if (!oldData) {
                    return {
                      notifications: [message.notification],
                      unread_count: 1,
                    };
                  }
                  return {
                    notifications: [
                      message.notification,
                      ...oldData.notifications,
                    ].slice(0, 10),
                    unread_count: oldData.unread_count + 1,
                  };
                }
              );

              // Call the notification callback if provided
              if (onNotificationRef.current) {
                onNotificationRef.current(message.notification);
              }
            }
          }
        } catch {
          // Ignore parse errors (ping messages, etc.)
        }
      };

      ws.onerror = () => {
        // Error handling - will reconnect via onclose
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Attempt to reconnect after 5 seconds if still authenticated
        if (isAuthenticatedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, queryClient]);
}
