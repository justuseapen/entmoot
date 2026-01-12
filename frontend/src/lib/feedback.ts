import { apiFetch } from "./api";

// Report types
export type ReportType =
  | "bug"
  | "feature_request"
  | "feedback"
  | "nps"
  | "quick_feedback";
export type Severity = "blocker" | "major" | "minor" | "cosmetic";
export type FeedbackStatus =
  | "new"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed";

// Context data that is automatically captured
export interface FeedbackContextData {
  url?: string;
  browser?: string;
  os?: string;
  screen_resolution?: string;
  app_version?: string;
  timestamp?: string;
  // Additional fields for specific feedback types
  score?: number; // for NPS
  follow_up?: string; // for NPS
  feature?: string; // for quick feedback
  rating?: "positive" | "negative"; // for quick feedback
}

// Request types
export interface CreateFeedbackData {
  report_type: ReportType;
  title: string;
  description?: string;
  severity?: Severity;
  allow_contact?: boolean;
  contact_email?: string;
  context_data?: FeedbackContextData;
  screenshot?: File;
}

// Response types
export interface FeedbackReport {
  id: number;
  report_type: ReportType;
  title: string;
  description: string | null;
  severity: Severity | null;
  status: FeedbackStatus;
  context_data: FeedbackContextData;
  allow_contact: boolean;
  contact_email: string | null;
  has_screenshot: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface CreateFeedbackResponse {
  feedback_report: FeedbackReport;
}

export interface GetFeedbackResponse {
  feedback_report: FeedbackReport;
}

// API functions
export async function createFeedback(
  data: CreateFeedbackData,
  token?: string
): Promise<CreateFeedbackResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // For screenshot uploads, we'd use FormData
  // For now, we'll just send JSON without screenshots
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { screenshot, ...jsonData } = data;

  return apiFetch<CreateFeedbackResponse>("/feedback", {
    method: "POST",
    headers,
    body: JSON.stringify(jsonData),
  });
}

export async function getFeedback(
  id: number,
  token: string
): Promise<GetFeedbackResponse> {
  return apiFetch<GetFeedbackResponse>(`/feedback/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Helper functions
export function captureContext(): FeedbackContextData {
  const userAgent = navigator.userAgent;
  const browser = detectBrowser(userAgent);
  const os = detectOS(userAgent);

  return {
    url: window.location.pathname,
    browser,
    os,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    app_version: "1.0.0", // This could be from a build variable
    timestamp: new Date().toISOString(),
  };
}

function detectBrowser(userAgent: string): string {
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Opera")) return "Opera";
  return "Unknown";
}

function detectOS(userAgent: string): string {
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
  return "Unknown";
}

// Report type display helpers
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  bug: "Bug Report",
  feature_request: "Feature Request",
  feedback: "General Feedback",
  nps: "NPS Survey",
  quick_feedback: "Quick Feedback",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  blocker: "Blocker - Can't use the app",
  major: "Major - Important feature broken",
  minor: "Minor - Annoying but workable",
  cosmetic: "Cosmetic - Visual issue only",
};

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "New",
  acknowledged: "Acknowledged",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};
