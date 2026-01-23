import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import * as Haptics from "expo-haptics";

/**
 * Notification type for navigation mapping
 */
export type NotificationType =
  | "reminder"
  | "goal_update"
  | "family_invite"
  | "badge_earned"
  | "general";

/**
 * Notification payload structure from push notifications
 */
export interface NotificationPayload {
  type: NotificationType;
  targetId?: string | number;
  title?: string;
  body?: string;
  link?: string;
  data?: Record<string, unknown>;
}

/**
 * Parse notification payload from expo notification data
 */
export function parseNotificationPayload(
  data: Record<string, unknown> | undefined
): NotificationPayload {
  if (!data) {
    return { type: "general" };
  }

  const type = (data.type as NotificationType) || "general";
  const targetId = data.targetId as string | number | undefined;
  const title = data.title as string | undefined;
  const body = data.body as string | undefined;
  const link = data.link as string | undefined;

  return {
    type,
    targetId,
    title,
    body,
    link,
    data,
  };
}

/**
 * Get navigation route based on notification type
 */
export function getNotificationRoute(
  payload: NotificationPayload
): { route: string; params?: Record<string, string | number> } | null {
  switch (payload.type) {
    case "reminder":
      return { route: "/(tabs)/today" };

    case "goal_update":
      if (payload.targetId) {
        return {
          route: "/goal/[id]",
          params: { id: payload.targetId },
        };
      }
      return { route: "/(tabs)/goals" };

    case "family_invite":
      return { route: "/settings/family" };

    case "badge_earned":
      return { route: "/(tabs)/me" };

    case "general":
    default:
      // Try to parse from link if available
      if (payload.link) {
        // Handle goal links
        const goalMatch = payload.link.match(/\/goals?\/(\d+)/);
        if (goalMatch) {
          return { route: "/goal/[id]", params: { id: goalMatch[1] } };
        }

        // Handle family links
        if (payload.link.includes("/family") || payload.link.includes("/invit")) {
          return { route: "/settings/family" };
        }

        // Handle daily planner links
        if (
          payload.link.includes("/daily") ||
          payload.link.includes("/today") ||
          payload.link.includes("/planner")
        ) {
          return { route: "/(tabs)/today" };
        }

        // Handle reflection links
        if (payload.link.includes("/reflect")) {
          return { route: "/reflection/quick" };
        }
      }
      return { route: "/(tabs)/today" };
  }
}

export interface InAppNotificationBannerProps {
  notification: {
    title: string;
    body: string;
    payload: NotificationPayload;
  } | null;
  onPress?: () => void;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

/**
 * In-app notification banner shown when a notification arrives while the app is in foreground
 */
export function InAppNotificationBanner({
  notification,
  onPress,
  onDismiss,
  autoDismissMs = 5000,
}: InAppNotificationBannerProps): React.JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    setIsVisible(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();

    // Auto-dismiss
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
    }
    dismissTimer.current = setTimeout(() => {
      hide();
    }, autoDismissMs);
  }, [slideAnim, autoDismissMs]);

  const hide = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  }, [slideAnim, onDismiss]);

  useEffect(() => {
    if (notification) {
      show();
    } else {
      hide();
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, [notification, show, hide]);

  const handlePress = () => {
    hide();
    onPress?.();
  };

  if (!isVisible || !notification) {
    return null;
  }

  const iconName = getIconForType(notification.payload.type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.banner}
        activeOpacity={0.8}
        onPress={handlePress}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={24} color={COLORS.background} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={(e) => {
            e.stopPropagation();
            hide();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

function getIconForType(
  type: NotificationType
): React.ComponentProps<typeof Ionicons>["name"] {
  switch (type) {
    case "reminder":
      return "alarm-outline";
    case "goal_update":
      return "flag-outline";
    case "family_invite":
      return "people-outline";
    case "badge_earned":
      return "trophy-outline";
    case "general":
    default:
      return "notifications-outline";
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 10,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});
