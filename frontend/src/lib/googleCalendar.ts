import { apiFetch } from "./api";
import { ApiError } from "./errors";

// Types
export interface GoogleCalendarStatus {
  connected: boolean;
  calendar_id?: string;
  calendar_name?: string;
  google_email?: string;
  sync_status?: "active" | "paused" | "error";
  last_sync_at?: string;
  last_error?: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  access_role: string;
}

export interface CalendarListResponse {
  calendars: GoogleCalendar[];
}

export interface AuthUrlResponse {
  auth_url: string;
}

export interface ConnectResponse {
  connected: boolean;
  calendar_id: string;
  calendar_name?: string;
  google_email?: string;
  sync_status: string;
}

export interface SyncResponse {
  message: string;
  sync_status: string;
}

export interface DisconnectResponse {
  disconnected: boolean;
}

export interface PauseResumeResponse {
  sync_status: "active" | "paused" | "error";
}

// API Functions
export async function getGoogleCalendarStatus(): Promise<GoogleCalendarStatus> {
  return apiFetch<GoogleCalendarStatus>("/users/me/google_calendar");
}

export async function getGoogleCalendarAuthUrl(): Promise<AuthUrlResponse> {
  return apiFetch<AuthUrlResponse>("/users/me/google_calendar/auth_url");
}

export async function getGoogleCalendars(
  tokens: string
): Promise<CalendarListResponse> {
  return apiFetch<CalendarListResponse>(
    `/users/me/google_calendar/calendars?tokens=${encodeURIComponent(tokens)}`
  );
}

export async function connectGoogleCalendar(params: {
  calendar_id: string;
  calendar_name?: string;
  google_email?: string;
  tokens: string;
}): Promise<ConnectResponse> {
  const { tokens, ...rest } = params;
  return apiFetch<ConnectResponse>(
    `/users/me/google_calendar/connect?tokens=${encodeURIComponent(tokens)}`,
    {
      method: "POST",
      body: JSON.stringify(rest),
    }
  );
}

export async function disconnectGoogleCalendar(): Promise<DisconnectResponse> {
  return apiFetch<DisconnectResponse>("/users/me/google_calendar", {
    method: "DELETE",
  });
}

export async function syncGoogleCalendar(): Promise<SyncResponse> {
  return apiFetch<SyncResponse>("/users/me/google_calendar/sync", {
    method: "POST",
  });
}

export async function pauseGoogleCalendar(): Promise<PauseResumeResponse> {
  return apiFetch<PauseResumeResponse>("/users/me/google_calendar/pause", {
    method: "POST",
  });
}

export async function resumeGoogleCalendar(): Promise<PauseResumeResponse> {
  return apiFetch<PauseResumeResponse>("/users/me/google_calendar/resume", {
    method: "POST",
  });
}

// Type guard for API errors
export function isGoogleCalendarError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
