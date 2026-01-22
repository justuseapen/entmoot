import * as Calendar from "expo-calendar";
import { Alert, Linking, Platform } from "react-native";
import { storage } from "./offlineStorage";

/**
 * Calendar permission status types
 */
export type CalendarPermissionStatus = "granted" | "denied" | "undetermined";

/**
 * Cache key for calendar permission status
 */
const CALENDAR_PERMISSION_KEY = "calendar:permission_status";

/**
 * Check if calendar feature is available on the device
 * @returns True if calendar API is available
 */
export async function isCalendarAvailable(): Promise<boolean> {
  try {
    // expo-calendar is available on iOS and Android
    return Platform.OS === "ios" || Platform.OS === "android";
  } catch (error) {
    console.error("[calendar] Error checking calendar availability:", error);
    return false;
  }
}

/**
 * Get the current calendar permission status
 * @returns Permission status: granted, denied, or undetermined
 */
export async function getCalendarPermissionStatus(): Promise<CalendarPermissionStatus> {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();

    let permissionStatus: CalendarPermissionStatus;

    switch (status) {
      case Calendar.PermissionStatus.GRANTED:
        permissionStatus = "granted";
        break;
      case Calendar.PermissionStatus.DENIED:
        permissionStatus = "denied";
        break;
      default:
        permissionStatus = "undetermined";
    }

    // Store permission status in MMKV cache
    storage.set(CALENDAR_PERMISSION_KEY, permissionStatus);

    return permissionStatus;
  } catch (error) {
    console.error("[calendar] Error getting permission status:", error);
    return "undetermined";
  }
}

/**
 * Get cached calendar permission status (synchronous)
 * @returns Cached permission status or null if not cached
 */
export function getCachedCalendarPermissionStatus(): CalendarPermissionStatus | null {
  try {
    const status = storage.getString(CALENDAR_PERMISSION_KEY);
    if (status && ["granted", "denied", "undetermined"].includes(status)) {
      return status as CalendarPermissionStatus;
    }
    return null;
  } catch (error) {
    console.error("[calendar] Error getting cached permission status:", error);
    return null;
  }
}

/**
 * Clear cached calendar permission status
 */
export function clearCachedCalendarPermissionStatus(): void {
  try {
    storage.remove(CALENDAR_PERMISSION_KEY);
  } catch (error) {
    console.error("[calendar] Error clearing cached permission status:", error);
  }
}

/**
 * Show an alert prompting the user to open Settings when permission is denied
 */
function showPermissionDeniedAlert(): void {
  Alert.alert(
    "Calendar Access Required",
    "To see your calendar events in the daily planning view, please enable calendar access in your device settings.",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Open Settings",
        onPress: () => {
          if (Platform.OS === "ios") {
            Linking.openURL("app-settings:");
          } else {
            Linking.openSettings();
          }
        },
      },
    ],
  );
}

/**
 * Request calendar permissions with user-facing explanation
 * @returns True if permission was granted, false otherwise
 */
export async function requestCalendarPermissions(): Promise<boolean> {
  try {
    // First check current status
    const currentStatus = await getCalendarPermissionStatus();

    if (currentStatus === "granted") {
      return true;
    }

    if (currentStatus === "denied") {
      // Permission was previously denied, show Settings alert
      showPermissionDeniedAlert();
      return false;
    }

    // Permission is undetermined, request it
    // Show explanation alert before requesting
    return new Promise((resolve) => {
      Alert.alert(
        "Calendar Access",
        "Entmoot would like to access your calendar to show your events in the daily planning view. This helps you plan your day around your existing commitments.",
        [
          {
            text: "Not Now",
            style: "cancel",
            onPress: () => {
              resolve(false);
            },
          },
          {
            text: "Continue",
            onPress: async () => {
              try {
                const { status } = await Calendar.requestCalendarPermissionsAsync();

                const isGranted = status === Calendar.PermissionStatus.GRANTED;

                // Update cached status
                const newStatus: CalendarPermissionStatus = isGranted ? "granted" : "denied";
                storage.set(CALENDAR_PERMISSION_KEY, newStatus);

                if (!isGranted) {
                  // Permission denied, show Settings alert
                  showPermissionDeniedAlert();
                }

                resolve(isGranted);
              } catch (error) {
                console.error("[calendar] Error requesting permission:", error);
                resolve(false);
              }
            },
          },
        ],
      );
    });
  } catch (error) {
    console.error("[calendar] Error in requestCalendarPermissions:", error);
    return false;
  }
}

/**
 * Check if calendar permission has been granted
 * @returns True if permission is granted
 */
export async function hasCalendarPermission(): Promise<boolean> {
  const status = await getCalendarPermissionStatus();
  return status === "granted";
}

/**
 * Open device settings for the app
 * Useful when permission is denied and user wants to re-enable
 */
export function openAppSettings(): void {
  if (Platform.OS === "ios") {
    Linking.openURL("app-settings:");
  } else {
    Linking.openSettings();
  }
}
