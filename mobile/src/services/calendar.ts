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

/**
 * Calendar event type returned from getTodayEvents
 */
export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  calendarColor: string | null;
  calendarTitle: string;
  location?: string;
  notes?: string;
}

/**
 * Get all device calendars
 * @returns List of calendars available on the device
 */
async function getDeviceCalendars(): Promise<Calendar.Calendar[]> {
  try {
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );
    return calendars;
  } catch (error) {
    console.error("[calendar] Error getting calendars:", error);
    return [];
  }
}

/**
 * Get all events for today from device calendars
 * @returns Array of calendar events sorted by start time
 */
export async function getTodayEvents(): Promise<CalendarEvent[]> {
  try {
    // Check permission first
    const hasPermission = await hasCalendarPermission();
    if (!hasPermission) {
      console.log("[calendar] No calendar permission, returning empty array");
      return [];
    }

    // Get all calendars
    const calendars = await getDeviceCalendars();
    if (calendars.length === 0) {
      return [];
    }

    // Get calendar IDs
    const calendarIds = calendars.map((cal) => cal.id);

    // Create a map of calendar ID to calendar info for quick lookup
    const calendarMap = new Map<
      string,
      { color: string | null; title: string }
    >();
    calendars.forEach((cal) => {
      calendarMap.set(cal.id, {
        color: cal.color ?? null,
        title: cal.title,
      });
    });

    // Define today's date range
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    // Fetch events for today
    const events = await Calendar.getEventsAsync(
      calendarIds,
      startOfToday,
      endOfToday
    );

    // Transform and sort events
    const calendarEvents: CalendarEvent[] = events.map((event) => {
      const calendarInfo = calendarMap.get(event.calendarId);
      return {
        id: event.id,
        title: event.title || "Untitled Event",
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        allDay: event.allDay ?? false,
        calendarColor: calendarInfo?.color ?? null,
        calendarTitle: calendarInfo?.title ?? "Calendar",
        location: event.location ?? undefined,
        notes: event.notes ?? undefined,
      };
    });

    // Sort events: all-day events first, then by start time
    calendarEvents.sort((a, b) => {
      // All-day events come first
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;

      // Then sort by start time
      return a.startDate.getTime() - b.startDate.getTime();
    });

    return calendarEvents;
  } catch (error) {
    console.error("[calendar] Error getting today's events:", error);
    return [];
  }
}
