import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ============================================
// Types
// ============================================

/**
 * Google Calendar connection status
 */
export interface GoogleCalendarConnection {
  connected: boolean;
  email?: string;
  calendars?: GoogleCalendar[];
  connected_at?: string;
}

/**
 * Individual Google Calendar synced with the app
 */
export interface GoogleCalendar {
  id: string;
  name: string;
  primary: boolean;
  color?: string;
}

/**
 * OAuth authorization URL response
 */
export interface GoogleCalendarAuthUrl {
  auth_url: string;
}

// ============================================
// Query Keys
// ============================================

export const googleCalendarKeys = {
  all: ["google_calendar"] as const,
  connection: () => [...googleCalendarKeys.all, "connection"] as const,
  authUrl: () => [...googleCalendarKeys.all, "auth_url"] as const,
};

// ============================================
// API Response Types
// ============================================

interface GoogleCalendarConnectionResponse {
  google_calendar: GoogleCalendarConnection;
}

interface GoogleCalendarAuthUrlResponse {
  auth_url: string;
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch Google Calendar connection status
 */
export function useGoogleCalendarConnection() {
  return useQuery({
    queryKey: googleCalendarKeys.connection(),
    queryFn: async (): Promise<GoogleCalendarConnection> => {
      try {
        const response = await api.get<GoogleCalendarConnectionResponse>(
          "/users/me/google_calendar"
        );
        return response.google_calendar;
      } catch (error) {
        // If not connected, return disconnected state instead of throwing
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes("404") ||
          errorMessage.includes("not found") ||
          errorMessage.includes("not connected")
        ) {
          return { connected: false };
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch the Google Calendar OAuth authorization URL
 */
export function useGoogleCalendarAuthUrl() {
  return useQuery({
    queryKey: googleCalendarKeys.authUrl(),
    queryFn: async (): Promise<string> => {
      const response = await api.get<GoogleCalendarAuthUrlResponse>(
        "/users/me/google_calendar/auth_url"
      );
      return response.auth_url;
    },
    enabled: false, // Don't fetch automatically, only when needed
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to connect Google Calendar after OAuth callback
 */
export function useConnectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string): Promise<GoogleCalendarConnection> => {
      const response = await api.post<GoogleCalendarConnectionResponse>(
        "/users/me/google_calendar",
        { code }
      );
      return response.google_calendar;
    },
    onSuccess: (data) => {
      // Update the connection status in cache
      queryClient.setQueryData(googleCalendarKeys.connection(), data);
    },
  });
}

/**
 * Hook to disconnect Google Calendar
 */
export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.del("/users/me/google_calendar");
    },
    onSuccess: () => {
      // Update the connection status in cache to disconnected
      queryClient.setQueryData(googleCalendarKeys.connection(), {
        connected: false,
      });
      // Invalidate to refetch if needed
      queryClient.invalidateQueries({
        queryKey: googleCalendarKeys.connection(),
      });
    },
  });
}

/**
 * Hook to refetch Google Calendar authorization URL manually
 */
export function useFetchAuthUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<string> => {
      const response = await api.get<GoogleCalendarAuthUrlResponse>(
        "/users/me/google_calendar/auth_url"
      );
      return response.auth_url;
    },
    onSuccess: (authUrl) => {
      queryClient.setQueryData(googleCalendarKeys.authUrl(), authUrl);
    },
  });
}
