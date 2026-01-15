import { apiFetch } from "@/lib/api";

// Types
export interface TaskCompletionMetrics {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
}

export interface GoalProgressMetrics {
  total_goals: number;
  completed_goals: number;
  in_progress_goals: number;
  average_progress: number;
}

export interface ReflectionConsistencyMetrics {
  total_reflections: number;
  days_in_month: number;
  consistency_rate: number;
}

export interface MonthlyReviewMetrics {
  task_completion: TaskCompletionMetrics;
  goal_progress: GoalProgressMetrics;
  reflection_consistency: ReflectionConsistencyMetrics;
}

export interface MonthlyReview {
  id: number;
  month: string;
  user_id: number;
  family_id: number;
  highlights: string[];
  challenges: string[];
  lessons_learned: string | null;
  next_month_focus: string[];
  completed: boolean;
  metrics?: MonthlyReviewMetrics;
  created_at: string;
  updated_at: string;
}

export interface MonthlyReviewsResponse {
  monthly_reviews: MonthlyReview[];
}

export interface MonthlyReviewResponse {
  monthly_review?: MonthlyReview;
  message?: string;
}

export interface UpdateMonthlyReviewData {
  highlights?: string[];
  challenges?: string[];
  lessons_learned?: string;
  next_month_focus?: string[];
  completed?: boolean;
}

// API functions
export async function getCurrentMonthlyReview(
  familyId: number
): Promise<MonthlyReview> {
  return apiFetch<MonthlyReview>(
    `/families/${familyId}/monthly_reviews/current`
  );
}

export async function getMonthlyReviews(
  familyId: number
): Promise<MonthlyReviewsResponse> {
  return apiFetch<MonthlyReviewsResponse>(
    `/families/${familyId}/monthly_reviews`
  );
}

export async function getMonthlyReview(
  familyId: number,
  reviewId: number
): Promise<MonthlyReview> {
  return apiFetch<MonthlyReview>(
    `/families/${familyId}/monthly_reviews/${reviewId}`
  );
}

export async function updateMonthlyReview(
  familyId: number,
  reviewId: number,
  data: UpdateMonthlyReviewData
): Promise<MonthlyReviewResponse> {
  return apiFetch<MonthlyReviewResponse>(
    `/families/${familyId}/monthly_reviews/${reviewId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ monthly_review: data }),
    }
  );
}

export async function getMonthlyReviewMetrics(
  familyId: number,
  reviewId: number
): Promise<{ metrics: MonthlyReviewMetrics }> {
  return apiFetch<{ metrics: MonthlyReviewMetrics }>(
    `/families/${familyId}/monthly_reviews/${reviewId}/metrics`
  );
}

// Helpers
export function formatMonthYear(monthDate: string): string {
  const date = new Date(monthDate);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function getMonthName(monthDate: string): string {
  const date = new Date(monthDate);
  return date.toLocaleDateString("en-US", { month: "long" });
}

export function formatMonthShort(monthDate: string): string {
  const date = new Date(monthDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

// Wizard steps
export interface WizardStep {
  key: string;
  title: string;
  description: string;
}

export const MONTHLY_REVIEW_STEPS: WizardStep[] = [
  {
    key: "metrics",
    title: "Month Metrics",
    description: "Review your month by the numbers",
  },
  {
    key: "highlights",
    title: "Highlights",
    description: "What went well this month?",
  },
  {
    key: "challenges",
    title: "Challenges",
    description: "What was challenging this month?",
  },
  {
    key: "lessons",
    title: "Lessons Learned",
    description: "What did you learn this month?",
  },
  {
    key: "focus",
    title: "Next Month Focus",
    description: "What will you focus on next month?",
  },
];
