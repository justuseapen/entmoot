import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Types for notification preferences
export interface ChannelPreferences {
  in_app: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface ReminderTime {
  enabled: boolean;
  time: string; // HH:MM format
}

export interface WeeklyReviewReminder extends ReminderTime {
  day: number; // 0 = Sunday, 1 = Monday, etc.
}

export interface ReminderPreferences {
  morning_planning: ReminderTime;
  evening_reflection: ReminderTime;
  weekly_review: WeeklyReviewReminder;
}

export interface QuietHours {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

export interface TipsPreferences {
  enabled: boolean;
}

export interface ReengagementPreferences {
  enabled: boolean;
  missed_checkin_reminder: boolean;
  inactivity_reminder: boolean;
  inactivity_threshold_days: number;
}

export type CheckInFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "as_needed";

export interface NotificationPreferences {
  id: number;
  channels: ChannelPreferences;
  reminders: ReminderPreferences;
  quiet_hours: QuietHours;
  tips: TipsPreferences;
  reengagement: ReengagementPreferences;
  check_in_frequency: CheckInFrequency;
  created_at: string;
  updated_at: string;
}

// Payload for updating preferences (flat structure as expected by backend)
export interface UpdateNotificationPreferencesPayload {
  // Channel preferences
  in_app?: boolean;
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  // Reminder toggles
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
  // Reengagement
  reengagement_enabled?: boolean;
  missed_checkin_reminder?: boolean;
  inactivity_reminder?: boolean;
  inactivity_threshold_days?: number;
  // Check-in frequency
  check_in_frequency?: CheckInFrequency;
}

interface NotificationPreferencesResponse {
  notification_preferences: NotificationPreferences;
}

// Query keys for cache management
export const notificationPreferencesKeys = {
  all: ["notificationPreferences"] as const,
  detail: () => [...notificationPreferencesKeys.all, "detail"] as const,
};

/**
 * Hook to fetch user's notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationPreferencesKeys.detail(),
    queryFn: async () => {
      const response =
        await api.get<NotificationPreferencesResponse>(
          "/users/me/notification_preferences"
        );
      return response.notification_preferences;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update user's notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateNotificationPreferencesPayload) => {
      const response = await api.patch<NotificationPreferencesResponse>(
        "/users/me/notification_preferences",
        { notification_preferences: payload }
      );
      return response.notification_preferences;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationPreferencesKeys.detail(),
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<NotificationPreferences>(
        notificationPreferencesKeys.detail()
      );

      // Optimistically update to the new value
      if (previousData) {
        const updatedData: NotificationPreferences = {
          ...previousData,
          channels: {
            ...previousData.channels,
            ...(newData.in_app !== undefined && { in_app: newData.in_app }),
            ...(newData.email !== undefined && { email: newData.email }),
            ...(newData.push !== undefined && { push: newData.push }),
            ...(newData.sms !== undefined && { sms: newData.sms }),
          },
          reminders: {
            ...previousData.reminders,
            morning_planning: {
              ...previousData.reminders.morning_planning,
              ...(newData.morning_planning !== undefined && {
                enabled: newData.morning_planning,
              }),
              ...(newData.morning_planning_time !== undefined && {
                time: newData.morning_planning_time,
              }),
            },
            evening_reflection: {
              ...previousData.reminders.evening_reflection,
              ...(newData.evening_reflection !== undefined && {
                enabled: newData.evening_reflection,
              }),
              ...(newData.evening_reflection_time !== undefined && {
                time: newData.evening_reflection_time,
              }),
            },
            weekly_review: {
              ...previousData.reminders.weekly_review,
              ...(newData.weekly_review !== undefined && {
                enabled: newData.weekly_review,
              }),
              ...(newData.weekly_review_time !== undefined && {
                time: newData.weekly_review_time,
              }),
              ...(newData.weekly_review_day !== undefined && {
                day: newData.weekly_review_day,
              }),
            },
          },
          quiet_hours: {
            ...previousData.quiet_hours,
            ...(newData.quiet_hours_start !== undefined && {
              start: newData.quiet_hours_start,
            }),
            ...(newData.quiet_hours_end !== undefined && {
              end: newData.quiet_hours_end,
            }),
          },
          tips: {
            ...previousData.tips,
            ...(newData.tips_enabled !== undefined && {
              enabled: newData.tips_enabled,
            }),
          },
          reengagement: {
            ...previousData.reengagement,
            ...(newData.reengagement_enabled !== undefined && {
              enabled: newData.reengagement_enabled,
            }),
            ...(newData.missed_checkin_reminder !== undefined && {
              missed_checkin_reminder: newData.missed_checkin_reminder,
            }),
            ...(newData.inactivity_reminder !== undefined && {
              inactivity_reminder: newData.inactivity_reminder,
            }),
            ...(newData.inactivity_threshold_days !== undefined && {
              inactivity_threshold_days: newData.inactivity_threshold_days,
            }),
          },
          ...(newData.check_in_frequency !== undefined && {
            check_in_frequency: newData.check_in_frequency,
          }),
        };

        queryClient.setQueryData(
          notificationPreferencesKeys.detail(),
          updatedData
        );
      }

      return { previousData };
    },
    onError: (_err, _newData, context) => {
      // Rollback to the previous value on error
      if (context?.previousData) {
        queryClient.setQueryData(
          notificationPreferencesKeys.detail(),
          context.previousData
        );
      }
    },
    onSettled: () => {
      // Sync with server after mutation
      queryClient.invalidateQueries({
        queryKey: notificationPreferencesKeys.detail(),
      });
    },
  });
}

// Helper to format time from HH:MM to a Date object
export function parseTimeString(timeString: string): Date {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// Helper to format Date to HH:MM string
export function formatTimeToString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Day of week labels
export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
