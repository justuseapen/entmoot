import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "@/lib/api";
import { getItem, setItem, removeItem } from "./secureStorage";

/**
 * Storage key for the push notification token
 */
const PUSH_TOKEN_KEY = "push_notification_token";

/**
 * Storage key for the registered device token ID from backend
 */
const DEVICE_TOKEN_ID_KEY = "device_token_id";

/**
 * Configure default notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user.
 *
 * @returns true if permissions were granted, false otherwise
 */
export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn(
      "[Notifications] Push notifications require a physical device"
    );
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Notifications] Permission denied for push notifications");
    return false;
  }

  return true;
}

/**
 * Get the current notification permission status.
 *
 * @returns The permission status: 'granted', 'denied', or 'undetermined'
 */
export async function getPermissionStatus(): Promise<
  "granted" | "denied" | "undetermined"
> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Response type from the device token registration API
 */
interface DeviceTokenResponse {
  device_token: {
    id: number;
    token: string;
    platform: string;
    created_at: string;
  };
}

/**
 * Register for push notifications and send the token to the backend.
 * This should be called after the user logs in and grants permission.
 *
 * @returns The Expo push token if successful, null otherwise
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check permissions first
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get the Expo push token
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error("[Notifications] No project ID found in config");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const pushToken = tokenData.data;
    console.log("[Notifications] Expo push token:", pushToken);

    // Store the token locally
    await setItem(PUSH_TOKEN_KEY, pushToken);

    // Register with the backend
    await registerTokenWithBackend(pushToken);

    return pushToken;
  } catch (error) {
    console.error(
      "[Notifications] Failed to register for notifications:",
      error
    );
    return null;
  }
}

/**
 * Register the push token with the backend server.
 *
 * @param token - The Expo push token
 */
async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    const response = await api.post<DeviceTokenResponse>("/device_tokens", {
      device_token: {
        token,
        platform: Platform.OS,
      },
    });

    // Store the device token ID for later unregistration
    if (response.device_token?.id) {
      await setItem(DEVICE_TOKEN_ID_KEY, String(response.device_token.id));
    }

    console.log("[Notifications] Token registered with backend successfully");
  } catch (error) {
    console.error(
      "[Notifications] Failed to register token with backend:",
      error
    );
    // Don't throw - the app should continue even if backend registration fails
  }
}

/**
 * Handle token refresh by re-registering with the backend.
 * Call this when you detect the token has changed (e.g., on app launch).
 */
export async function handleTokenRefresh(): Promise<void> {
  try {
    const storedToken = await getItem(PUSH_TOKEN_KEY);

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      return;
    }

    const currentTokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const currentToken = currentTokenData.data;

    // If token changed, re-register
    if (storedToken !== currentToken && currentToken) {
      console.log("[Notifications] Token changed, re-registering...");
      await setItem(PUSH_TOKEN_KEY, currentToken);
      await registerTokenWithBackend(currentToken);
    }
  } catch (error) {
    console.error("[Notifications] Failed to handle token refresh:", error);
  }
}

/**
 * Unregister the device token from the backend.
 * Call this when the user logs out.
 */
export async function unregisterToken(): Promise<void> {
  try {
    const deviceTokenId = await getItem(DEVICE_TOKEN_ID_KEY);

    if (deviceTokenId) {
      try {
        await api.del(`/device_tokens/${deviceTokenId}`);
        console.log("[Notifications] Token unregistered from backend");
      } catch (error) {
        // Log but don't throw - user should still be able to log out
        console.error(
          "[Notifications] Failed to unregister token from backend:",
          error
        );
      }
    }

    // Clear local storage regardless of backend result
    await removeItem(PUSH_TOKEN_KEY);
    await removeItem(DEVICE_TOKEN_ID_KEY);
  } catch (error) {
    console.error("[Notifications] Failed to unregister token:", error);
  }
}

/**
 * Get the stored push notification token.
 *
 * @returns The stored token or null if not registered
 */
export async function getStoredPushToken(): Promise<string | null> {
  return getItem(PUSH_TOKEN_KEY);
}

/**
 * Cancel all scheduled local notifications.
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Set the badge count on the app icon.
 *
 * @param count - The badge count (0 to clear)
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// ============================================================================
// Local Notification Scheduling
// ============================================================================

/**
 * Notification identifiers for scheduled reminders
 */
const NOTIFICATION_IDENTIFIERS = {
  MORNING_PLANNING: "morning_planning_reminder",
  EVENING_REFLECTION: "evening_reflection_reminder",
  WEEKLY_REVIEW: "weekly_review_reminder",
};

/**
 * Interface for scheduling preferences (matches useNotificationPreferences types)
 */
export interface SchedulingPreferences {
  reminders: {
    morning_planning: {
      enabled: boolean;
      time: string; // HH:MM format
    };
    evening_reflection: {
      enabled: boolean;
      time: string; // HH:MM format
    };
    weekly_review: {
      enabled: boolean;
      time: string; // HH:MM format
      day: number; // 0 = Sunday, 1 = Monday, etc.
    };
  };
  quiet_hours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
}

/**
 * Parse a time string (HH:MM) into hours and minutes
 */
function parseTime(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(":").map(Number);
  return { hours, minutes };
}

/**
 * Check if a given time falls within quiet hours.
 * Handles quiet hours that span midnight (e.g., 22:00 to 07:00)
 *
 * @param timeHours - The hour of the notification time (0-23)
 * @param quietHours - The quiet hours configuration
 * @returns true if the time is within quiet hours
 */
export function isWithinQuietHours(
  timeHours: number,
  quietHours: { start: string; end: string }
): boolean {
  const start = parseTime(quietHours.start);
  const end = parseTime(quietHours.end);

  // If start and end are the same, quiet hours are disabled
  if (start.hours === end.hours && start.minutes === end.minutes) {
    return false;
  }

  // Convert to minutes for easier comparison
  const timeMinutes = timeHours * 60;
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  // Handle case where quiet hours span midnight (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    // Quiet hours cross midnight
    return timeMinutes >= startMinutes || timeMinutes < endMinutes;
  } else {
    // Normal case (e.g., 23:00 to 06:00 within same day)
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  }
}

/**
 * Schedule the morning planning reminder as a daily notification.
 *
 * @param time - The time string in HH:MM format
 * @param quietHours - The quiet hours configuration
 */
async function scheduleMorningPlanningReminder(
  time: string,
  quietHours: { start: string; end: string }
): Promise<void> {
  const { hours, minutes } = parseTime(time);

  // Skip if this time falls within quiet hours
  if (isWithinQuietHours(hours, quietHours)) {
    console.log(
      "[Notifications] Morning planning time is within quiet hours, skipping"
    );
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDENTIFIERS.MORNING_PLANNING,
    content: {
      title: "Plan Your Day",
      body: "Take a moment to set your intentions and priorities for today.",
      sound: "default",
      data: {
        type: "reminder",
        targetId: null,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });

  console.log(
    `[Notifications] Morning planning reminder scheduled for ${time} daily`
  );
}

/**
 * Schedule the evening reflection reminder as a daily notification.
 *
 * @param time - The time string in HH:MM format
 * @param quietHours - The quiet hours configuration
 */
async function scheduleEveningReflectionReminder(
  time: string,
  quietHours: { start: string; end: string }
): Promise<void> {
  const { hours, minutes } = parseTime(time);

  // Skip if this time falls within quiet hours
  if (isWithinQuietHours(hours, quietHours)) {
    console.log(
      "[Notifications] Evening reflection time is within quiet hours, skipping"
    );
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDENTIFIERS.EVENING_REFLECTION,
    content: {
      title: "Time to Reflect",
      body: "How was your day? Take a moment to reflect on what you accomplished.",
      sound: "default",
      data: {
        type: "reminder",
        targetId: null,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });

  console.log(
    `[Notifications] Evening reflection reminder scheduled for ${time} daily`
  );
}

/**
 * Schedule the weekly review reminder as a weekly notification.
 *
 * @param time - The time string in HH:MM format
 * @param day - The day of the week (0 = Sunday, 1 = Monday, etc.)
 * @param quietHours - The quiet hours configuration
 */
async function scheduleWeeklyReviewReminder(
  time: string,
  day: number,
  quietHours: { start: string; end: string }
): Promise<void> {
  const { hours, minutes } = parseTime(time);

  // Skip if this time falls within quiet hours
  if (isWithinQuietHours(hours, quietHours)) {
    console.log(
      "[Notifications] Weekly review time is within quiet hours, skipping"
    );
    return;
  }

  // expo-notifications uses 1-7 for weekdays (1 = Sunday)
  // Our API uses 0-6 (0 = Sunday), so add 1
  const weekday = day + 1;

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDENTIFIERS.WEEKLY_REVIEW,
    content: {
      title: "Weekly Review Time",
      body: "Review your week's progress and plan for the week ahead.",
      sound: "default",
      data: {
        type: "reminder",
        targetId: null,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7,
      hour: hours,
      minute: minutes,
    },
  });

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  console.log(
    `[Notifications] Weekly review reminder scheduled for ${dayNames[day]} at ${time}`
  );
}

/**
 * Schedule all local notifications based on user preferences.
 * This should be called when:
 * - User logs in
 * - User updates notification preferences
 * - App launches and user is authenticated
 *
 * @param preferences - The user's notification scheduling preferences
 */
export async function scheduleLocalNotifications(
  preferences: SchedulingPreferences
): Promise<void> {
  try {
    // First, cancel all existing scheduled notifications
    await cancelAllScheduledNotifications();

    const { reminders, quiet_hours } = preferences;

    // Schedule morning planning reminder if enabled
    if (reminders.morning_planning.enabled) {
      await scheduleMorningPlanningReminder(
        reminders.morning_planning.time,
        quiet_hours
      );
    }

    // Schedule evening reflection reminder if enabled
    if (reminders.evening_reflection.enabled) {
      await scheduleEveningReflectionReminder(
        reminders.evening_reflection.time,
        quiet_hours
      );
    }

    // Schedule weekly review reminder if enabled
    if (reminders.weekly_review.enabled) {
      await scheduleWeeklyReviewReminder(
        reminders.weekly_review.time,
        reminders.weekly_review.day,
        quiet_hours
      );
    }

    console.log("[Notifications] Local notifications scheduled successfully");
  } catch (error) {
    console.error(
      "[Notifications] Failed to schedule local notifications:",
      error
    );
  }
}

/**
 * Reschedule all notifications when preferences change.
 * This is an alias for scheduleLocalNotifications for semantic clarity.
 *
 * @param preferences - The updated notification scheduling preferences
 */
export async function rescheduleAllNotifications(
  preferences: SchedulingPreferences
): Promise<void> {
  await scheduleLocalNotifications(preferences);
}

/**
 * Cancel all scheduled local notifications.
 * Call this when the user logs out.
 */
export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log("[Notifications] All scheduled notifications cancelled");
}

/**
 * Get all currently scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return Notifications.getAllScheduledNotificationsAsync();
}
