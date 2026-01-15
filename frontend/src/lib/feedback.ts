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
  data: CreateFeedbackData
): Promise<CreateFeedbackResponse> {
  // For screenshot uploads, we'd use FormData
  // For now, we'll just send JSON without screenshots
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { screenshot, ...jsonData } = data;

  return apiFetch<CreateFeedbackResponse>("/feedback", {
    method: "POST",
    body: JSON.stringify(jsonData),
  });
}

export async function getFeedback(id: number): Promise<GetFeedbackResponse> {
  return apiFetch<GetFeedbackResponse>(`/feedback/${id}`);
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

// NPS-specific types
export type NPSCategory = "promoter" | "passive" | "detractor" | "unknown";

export interface FeedbackEligibility {
  nps_eligible: boolean;
  days_until_nps_eligible: number;
  last_nps_date: string | null;
}

export interface NPSFollowUpResponse {
  question: string;
  category: NPSCategory;
}

export interface DismissNPSResponse {
  success: boolean;
  next_eligible_date: string;
}

// Proactive feedback API functions
export async function getFeedbackEligibility(): Promise<FeedbackEligibility> {
  return apiFetch<FeedbackEligibility>("/feedback/eligibility");
}

export async function dismissNPS(): Promise<DismissNPSResponse> {
  return apiFetch<DismissNPSResponse>("/feedback/dismiss_nps", {
    method: "POST",
  });
}

export async function getNPSFollowUp(
  score: number
): Promise<NPSFollowUpResponse> {
  return apiFetch<NPSFollowUpResponse>(
    `/feedback/nps_follow_up?score=${score}`
  );
}

// Helper to submit NPS feedback
export async function submitNPSFeedback(
  score: number,
  followUp: string
): Promise<CreateFeedbackResponse> {
  return createFeedback({
    report_type: "nps",
    title: "NPS Survey Response",
    description: followUp || undefined,
    context_data: {
      ...captureContext(),
      score,
      follow_up: followUp,
    },
  });
}

// Helper to submit feature feedback
export async function submitFeatureFeedback(
  feature: string,
  rating: "positive" | "negative",
  additionalFeedback: string | undefined
): Promise<CreateFeedbackResponse> {
  return createFeedback({
    report_type: "quick_feedback",
    title: `Feature Feedback: ${feature}`,
    description: additionalFeedback,
    context_data: {
      ...captureContext(),
      feature,
      rating,
    },
  });
}

// Helper to submit session feedback
export type SessionRating = 1 | 2 | 3 | 4 | 5;

export async function submitSessionFeedback(
  flowType: string,
  rating: SessionRating,
  additionalFeedback: string | undefined
): Promise<CreateFeedbackResponse> {
  return createFeedback({
    report_type: "quick_feedback",
    title: `Session Feedback: ${flowType}`,
    description: additionalFeedback,
    context_data: {
      ...captureContext(),
      feature: flowType,
      rating: rating >= 4 ? "positive" : "negative",
    },
  });
}

// Session feedback emoji options
export const SESSION_RATING_EMOJIS: Record<
  SessionRating,
  { emoji: string; label: string }
> = {
  1: { emoji: "😞", label: "Very Poor" },
  2: { emoji: "😕", label: "Poor" },
  3: { emoji: "😐", label: "Okay" },
  4: { emoji: "😊", label: "Good" },
  5: { emoji: "😍", label: "Excellent" },
};
