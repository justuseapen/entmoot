import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import type { DevicePlatform } from "@shared/types";
import { registerDeviceToken, unregisterDeviceToken } from "./deviceTokens";

// Configure how notifications are handled when the app is in foreground
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
 * Get the device platform for the backend
 */
function getDevicePlatform(): DevicePlatform {
  if (Platform.OS === "ios") {
    return "ios";
  } else if (Platform.OS === "android") {
    return "android";
  }
  return "web";
}

/**
 * Get a human-readable device name
 */
function getDeviceName(): string {
  if (Device.deviceName) {
    return Device.deviceName;
  }
  const brand = Device.brand || "Unknown";
  const model = Device.modelName || "Device";
  return `${brand} ${model}`;
}

/**
 * Request push notification permissions
 * Returns true if permissions were granted
 */
export async function requestPushNotificationPermissions(): Promise<boolean> {
  // Only works on physical devices
  if (!Device.isDevice) {
    console.log("Push notifications only work on physical devices");
    return false;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  // If already granted, return true
  if (existingStatus === "granted") {
    return true;
  }

  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Get the Expo push token for this device
 * Returns null if push notifications are not available
 */
export async function getExpoPushToken(): Promise<string | null> {
  // Only works on physical devices
  if (!Device.isDevice) {
    console.log("Push notifications only work on physical devices");
    return null;
  }

  try {
    // Get the project ID from app config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

/**
 * Register the device for push notifications
 * This should be called after successful login
 */
export async function registerForPushNotifications(): Promise<boolean> {
  try {
    // Request permissions
    const hasPermission = await requestPushNotificationPermissions();
    if (!hasPermission) {
      console.log("Push notification permissions not granted");
      return false;
    }

    // Get the push token
    const token = await getExpoPushToken();
    if (!token) {
      console.log("Could not get push token");
      return false;
    }

    // Register with backend
    await registerDeviceToken({
      token,
      platform: getDevicePlatform(),
      device_name: getDeviceName(),
    });

    console.log("Successfully registered for push notifications");
    return true;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return false;
  }
}

/**
 * Unregister the device from push notifications
 * This should be called on logout
 */
export async function unregisterFromPushNotifications(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (token) {
      await unregisterDeviceToken({ token });
      console.log("Successfully unregistered from push notifications");
    }
  } catch (error) {
    // Ignore errors during unregistration - user is logging out anyway
    console.error("Error unregistering from push notifications:", error);
  }
}

/**
 * Parse the link from a notification into a navigation route
 * Returns the screen name and params for React Navigation
 */
export function parseNotificationLink(
  link: string | null | undefined
): { screen: string; params?: Record<string, string> } | null {
  if (!link) {
    return null;
  }

  // Parse different link formats
  // Format: /families/:familyId/goals/:goalId -> GoalDetail { goalId }
  // Format: /families/:familyId/daily-planner -> Main.DailyPlanner
  // Format: /families/:familyId/reflections -> Main.Dashboard (for now)
  // Format: /notifications -> Notifications

  // Goal detail
  const goalMatch = link.match(/\/families\/(\d+)\/goals\/(\d+)/);
  if (goalMatch) {
    return { screen: "GoalDetail", params: { goalId: goalMatch[2] } };
  }

  // Daily planner
  if (link.includes("/daily-planner") || link.includes("/daily_plans")) {
    return { screen: "Main", params: { screen: "DailyPlanner" } };
  }

  // Reflections
  if (link.includes("/reflections")) {
    return { screen: "Main", params: { screen: "Dashboard" } };
  }

  // Weekly review
  if (link.includes("/weekly-review") || link.includes("/weekly_reviews")) {
    return { screen: "Main", params: { screen: "Dashboard" } };
  }

  // Notifications
  if (link === "/notifications") {
    return { screen: "Notifications" };
  }

  // Family
  const familyMatch = link.match(/\/families\/(\d+)$/);
  if (familyMatch) {
    return { screen: "Main", params: { screen: "Family" } };
  }

  // Default to dashboard
  return { screen: "Main", params: { screen: "Dashboard" } };
}

/**
 * Get notification data from an Expo notification
 */
export function getNotificationData(notification: Notifications.Notification): {
  title: string;
  body: string;
  link: string | null;
  data: Record<string, unknown>;
} {
  const content = notification.request.content;
  const data = content.data || {};

  return {
    title: content.title || "",
    body: content.body || "",
    link: (data.link as string) || null,
    data: data as Record<string, unknown>,
  };
}

export type NotificationReceivedHandler = (
  notification: Notifications.Notification
) => void;

export type NotificationResponseHandler = (
  response: Notifications.NotificationResponse
) => void;

/**
 * Add a listener for received notifications (foreground)
 */
export function addNotificationReceivedListener(
  handler: NotificationReceivedHandler
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Add a listener for notification responses (user tapped notification)
 */
export function addNotificationResponseListener(
  handler: NotificationResponseHandler
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Remove a notification subscription
 */
export function removeNotificationSubscription(
  subscription: Notifications.Subscription
): void {
  subscription.remove();
}

/**
 * Get the last notification response (for cold start from notification)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}

/**
 * Set the badge count (iOS only)
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === "ios") {
    await Notifications.setBadgeCountAsync(count);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
