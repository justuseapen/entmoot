import { apiFetch } from "./api";
import type {
  ReportType,
  Severity,
  FeedbackStatus,
  FeedbackContextData,
} from "./feedback";

// User summary in admin responses
export interface UserSummary {
  id: number;
  name: string;
  email: string;
}

// Duplicate summary
export interface DuplicateSummary {
  id: number;
  title: string;
  status: FeedbackStatus;
}

// Admin feedback report (list view)
export interface AdminFeedbackReport {
  id: number;
  report_type: ReportType;
  title: string;
  severity: Severity | null;
  status: FeedbackStatus;
  created_at: string;
  user: UserSummary | null;
  assigned_to: UserSummary | null;
  duplicate_of_id: number | null;
  internal_notes: string | null;
}

// Admin feedback report (detail view)
export interface AdminFeedbackReportDetail extends AdminFeedbackReport {
  description: string | null;
  context_data: FeedbackContextData;
  allow_contact: boolean;
  contact_email: string | null;
  has_screenshot: boolean;
  screenshot_url: string | null;
  resolved_at: string | null;
  duplicate_of: DuplicateSummary | null;
  duplicates_count: number;
}

// Pagination metadata
export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

// List response
export interface AdminFeedbackListResponse {
  feedback_reports: AdminFeedbackReport[];
  meta: PaginationMeta;
}

// Detail response
export interface AdminFeedbackDetailResponse {
  feedback_report: AdminFeedbackReportDetail;
}

// Filter params
export interface AdminFeedbackFilters {
  type?: ReportType;
  status?: FeedbackStatus;
  severity?: Severity;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

// Update params
export interface UpdateFeedbackData {
  status?: FeedbackStatus;
  assigned_to_id?: number | null;
  internal_notes?: string;
  duplicate_of_id?: number | null;
}

// API functions
export async function getAdminFeedbackList(
  filters: AdminFeedbackFilters
): Promise<AdminFeedbackListResponse> {
  const params = new URLSearchParams();

  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.start_date) params.set("start_date", filters.start_date);
  if (filters.end_date) params.set("end_date", filters.end_date);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.per_page) params.set("per_page", String(filters.per_page));

  const queryString = params.toString();
  const url = `/admin/feedback${queryString ? `?${queryString}` : ""}`;

  return apiFetch<AdminFeedbackListResponse>(url);
}

export async function getAdminFeedbackDetail(
  id: number
): Promise<AdminFeedbackDetailResponse> {
  return apiFetch<AdminFeedbackDetailResponse>(`/admin/feedback/${id}`);
}

export async function updateAdminFeedback(
  id: number,
  data: UpdateFeedbackData
): Promise<AdminFeedbackDetailResponse> {
  return apiFetch<AdminFeedbackDetailResponse>(`/admin/feedback/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ feedback_report: data }),
  });
}

// Helper functions
export const STATUS_COLORS: Record<FeedbackStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  acknowledged: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  blocker: "bg-red-100 text-red-800",
  major: "bg-orange-100 text-orange-800",
  minor: "bg-yellow-100 text-yellow-800",
  cosmetic: "bg-gray-100 text-gray-800",
};

export const TYPE_ICONS: Record<ReportType, string> = {
  bug: "🐛",
  feature_request: "💡",
  feedback: "💬",
  nps: "📊",
  quick_feedback: "👍",
};

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
