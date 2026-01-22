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
    console.error("[Notifications] Failed to register for notifications:", error);
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
    console.error("[Notifications] Failed to register token with backend:", error);
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
        console.error("[Notifications] Failed to unregister token from backend:", error);
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
