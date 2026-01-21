import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGoogleCalendarStatus,
  getGoogleCalendarAuthUrl,
  getGoogleCalendars,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  syncGoogleCalendar,
  pauseGoogleCalendar,
  resumeGoogleCalendar,
  type GoogleCalendarStatus,
  type CalendarListResponse,
} from "@/lib/googleCalendar";

const GOOGLE_CALENDAR_KEY = ["googleCalendar"];
const GOOGLE_CALENDARS_LIST_KEY = ["googleCalendars"];

// Hook to get Google Calendar connection status
export function useGoogleCalendarStatus() {
  return useQuery<GoogleCalendarStatus>({
    queryKey: GOOGLE_CALENDAR_KEY,
    queryFn: getGoogleCalendarStatus,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to get auth URL (initiates OAuth flow)
export function useGoogleCalendarAuthUrl() {
  return useMutation({
    mutationFn: getGoogleCalendarAuthUrl,
    onSuccess: (data) => {
      // Redirect to Google OAuth
      window.location.href = data.auth_url;
    },
  });
}

// Hook to list available calendars (after OAuth callback)
export function useGoogleCalendarsList() {
  return useQuery<CalendarListResponse>({
    queryKey: GOOGLE_CALENDARS_LIST_KEY,
    queryFn: getGoogleCalendars,
    enabled: false, // Only fetch when explicitly called
    retry: false, // Don't retry on failure (session may have expired)
  });
}

// Hook to connect a selected calendar
export function useConnectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectGoogleCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOOGLE_CALENDAR_KEY });
    },
  });
}

// Hook to disconnect Google Calendar
export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectGoogleCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOOGLE_CALENDAR_KEY });
    },
  });
}

// Hook to trigger manual sync
export function useSyncGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncGoogleCalendar,
    onSuccess: () => {
      // Invalidate after a short delay to allow sync to start
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: GOOGLE_CALENDAR_KEY });
      }, 2000);
    },
  });
}

// Hook to pause calendar sync
export function usePauseGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseGoogleCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOOGLE_CALENDAR_KEY });
    },
  });
}

// Hook to resume calendar sync
export function useResumeGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumeGoogleCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOOGLE_CALENDAR_KEY });
    },
  });
}
