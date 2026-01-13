import { apiFetch } from "./api";

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

// Check-in frequency options
export type CheckInFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "as_needed";

export const CHECK_IN_FREQUENCIES: {
  value: CheckInFrequency;
  label: string;
  description: string;
}[] = [
  {
    value: "daily",
    label: "Daily",
    description: "Morning planning and evening reflection every day",
  },
  {
    value: "weekly",
    label: "Weekly",
    description: "Weekly review reminders only",
  },
  {
    value: "monthly",
    label: "Monthly",
    description: "Monthly review reminders only",
  },
  {
    value: "quarterly",
    label: "Quarterly",
    description: "Quarterly review reminders only",
  },
  {
    value: "annual",
    label: "Annual",
    description: "Annual review reminders only",
  },
  {
    value: "as_needed",
    label: "As Needed",
    description: "No automatic reminders - check in when you want",
  },
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

// Re-engagement preferences
export interface ReengagementPreferences {
  enabled: boolean;
  missed_checkin_reminder: boolean;
  inactivity_reminder: boolean;
  inactivity_threshold_days: number;
}

// Full notification preferences from API
export interface NotificationPreferences {
  id: number;
  channels: ChannelPreferences;
  reminders: ReminderPreferences;
  quiet_hours: QuietHoursPreferences;
  tips?: TipsPreferences;
  reengagement?: ReengagementPreferences;
  check_in_frequency: CheckInFrequency;
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
  // Re-engagement preferences
  reengagement_enabled?: boolean;
  missed_checkin_reminder?: boolean;
  inactivity_reminder?: boolean;
  inactivity_threshold_days?: number;
  // Check-in frequency
  check_in_frequency?: CheckInFrequency;
}

// Inactivity threshold options for the selector
export const INACTIVITY_THRESHOLD_OPTIONS = [
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
];

// Get notification preferences
export async function getNotificationPreferences(
  token: string
): Promise<{ notification_preferences: NotificationPreferences }> {
  return apiFetch("/users/me/notification_preferences", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Update notification preferences
export async function updateNotificationPreferences(
  data: UpdateNotificationPreferencesData,
  token: string
): Promise<{ notification_preferences: NotificationPreferences }> {
  return apiFetch("/users/me/notification_preferences", {
    method: "PATCH",
    body: JSON.stringify({ notification_preferences: data }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Helper to format time for display (HH:MM to 12-hour format)
export function formatTimeDisplay(time: string): string {
  const [hourStr, minute] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${ampm}`;
}

// Helper to generate time options for select (every 30 minutes)
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

// Helper functions for check-in frequency
export function isDailyFrequency(frequency: CheckInFrequency): boolean {
  return frequency === "daily";
}

export function isWeeklyOrMoreFrequent(frequency: CheckInFrequency): boolean {
  return ["daily", "weekly"].includes(frequency);
}

export function isMonthlyOrMoreFrequent(frequency: CheckInFrequency): boolean {
  return ["daily", "weekly", "monthly"].includes(frequency);
}

export function isQuarterlyOrMoreFrequent(
  frequency: CheckInFrequency
): boolean {
  return ["daily", "weekly", "monthly", "quarterly"].includes(frequency);
}

export function isAnnualOrMoreFrequent(frequency: CheckInFrequency): boolean {
  return ["daily", "weekly", "monthly", "quarterly", "annual"].includes(
    frequency
  );
}

// Get the schedule preview message
export function getSchedulePreview(
  prefs: NotificationPreferences,
  familyTimezone?: string
): string[] {
  const schedule: string[] = [];
  const tz = familyTimezone || "your timezone";
  const frequency = prefs.check_in_frequency;

  // Add frequency info at the top
  const freqLabel = CHECK_IN_FREQUENCIES.find(
    (f) => f.value === frequency
  )?.label;
  schedule.push(`Check-in frequency: ${freqLabel}`);

  if (frequency === "as_needed") {
    schedule.push("No automatic reminders - check in when you want");
    return schedule;
  }

  if (isDailyFrequency(frequency) && prefs.reminders.morning_planning.enabled) {
    const time = formatTimeDisplay(prefs.reminders.morning_planning.time);
    schedule.push(`Morning planning reminder at ${time}`);
  }

  if (
    isDailyFrequency(frequency) &&
    prefs.reminders.evening_reflection.enabled
  ) {
    const time = formatTimeDisplay(prefs.reminders.evening_reflection.time);
    schedule.push(`Evening reflection reminder at ${time}`);
  }

  if (
    isWeeklyOrMoreFrequent(frequency) &&
    prefs.reminders.weekly_review.enabled
  ) {
    const time = formatTimeDisplay(prefs.reminders.weekly_review.time);
    const day = DAYS_OF_WEEK.find(
      (d) => d.value === prefs.reminders.weekly_review.day
    )?.label;
    schedule.push(`Weekly review reminder on ${day}s at ${time}`);
  }

  if (schedule.length === 1) {
    schedule.push("No reminders scheduled for your frequency level");
  } else {
    schedule.push(`All times are in ${tz}`);
  }

  return schedule;
}
