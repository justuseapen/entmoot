import { authFetch } from "./api";

// Day of week mapping for weekly review
export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// Channel preferences
export interface ChannelPreferences {
  in_app: boolean;
  email: boolean;
  push: boolean;
}

// Reminder preference (enabled + time)
export interface ReminderPreference {
  enabled: boolean;
  time: string; // HH:MM format
}

// Weekly review has an additional day field
export interface WeeklyReviewPreference extends ReminderPreference {
  day: number; // 0-6 (Sunday-Saturday)
}

// All reminder preferences
export interface ReminderPreferences {
  morning_planning: ReminderPreference;
  evening_reflection: ReminderPreference;
  weekly_review: WeeklyReviewPreference;
}

// Quiet hours
export interface QuietHoursPreferences {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

// Tips preferences
export interface TipsPreferences {
  enabled: boolean;
}

// Full notification preferences from API
export interface NotificationPreferences {
  id: number;
  channels: ChannelPreferences;
  reminders: ReminderPreferences;
  quiet_hours: QuietHoursPreferences;
  tips?: TipsPreferences;
  created_at: string;
  updated_at: string;
}

// Update params (flat structure for API)
export interface UpdateNotificationPreferencesData {
  // Channel preferences
  in_app?: boolean;
  email?: boolean;
  push?: boolean;
  // Reminder enabled flags
  morning_planning?: boolean;
  evening_reflection?: boolean;
  weekly_review?: boolean;
  // Reminder times
  morning_planning_time?: string;
  evening_reflection_time?: string;
  weekly_review_time?: string;
  weekly_review_day?: number;
  // Quiet hours
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  // Tips
  tips_enabled?: boolean;
}

// Get notification preferences
export async function getNotificationPreferences(): Promise<{
  notification_preferences: NotificationPreferences;
}> {
  return authFetch<{ notification_preferences: NotificationPreferences }>(
    "/users/me/notification_preferences"
  );
}

// Update notification preferences
export async function updateNotificationPreferences(
  data: UpdateNotificationPreferencesData
): Promise<{ notification_preferences: NotificationPreferences }> {
  return authFetch<{ notification_preferences: NotificationPreferences }>(
    "/users/me/notification_preferences",
    {
      method: "PATCH",
      body: JSON.stringify({ notification_preferences: data }),
    }
  );
}

// Helper to format time for display (HH:MM to 12-hour format)
export function formatTimeDisplay(time: string): string {
  const [hourStr, minute] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${ampm}`;
}

// Generate time options for picker (every 30 minutes)
export function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of ["00", "30"]) {
      const value = `${hour.toString().padStart(2, "0")}:${minute}`;
      options.push({ value, label: formatTimeDisplay(value) });
    }
  }
  return options;
}

// Parse HH:MM time string to Date object for DateTimePicker
export function parseTimeToDate(time: string): Date {
  const [hourStr, minuteStr] = time.split(":");
  const date = new Date();
  date.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0);
  return date;
}

// Format Date object back to HH:MM string
export function formatDateToTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
