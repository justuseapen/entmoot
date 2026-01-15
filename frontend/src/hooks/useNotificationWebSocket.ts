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
// Uses session cookies for auth (set during login) - no token in URL needed
export function useNotificationWebSocket(
  onNotification?: NotificationCallback
) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  // Connection ID to prevent stale connections from reconnecting after logout
  const connectionIdRef = useRef(0);
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
    // Increment connection ID on each effect run to invalidate stale connections
    connectionIdRef.current += 1;
    const currentConnectionId = connectionIdRef.current;

    if (!isAuthenticated) {
      // Clean up if not authenticated (logout)
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
      // Check if this connection attempt is stale (auth state changed)
      if (
        currentConnectionId !== connectionIdRef.current ||
        !isAuthenticatedRef.current
      ) {
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      // Determine WebSocket URL based on environment
      // Auth is handled via session cookies (set during login), no token needed in URL
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = import.meta.env.DEV
        ? "localhost:3000"
        : window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/cable`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Don't proceed if connection became stale
        if (currentConnectionId !== connectionIdRef.current) {
          ws.close();
          return;
        }

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
        // Only reconnect if:
        // 1. This connection is still current (not stale)
        // 2. User is still authenticated
        if (
          currentConnectionId === connectionIdRef.current &&
          isAuthenticatedRef.current
        ) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      };
    }

    connect();

    return () => {
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Close existing connection cleanly
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, queryClient]);
}
