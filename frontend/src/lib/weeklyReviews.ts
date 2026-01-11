import { apiFetch } from "@/lib/api";

// Types
export interface TaskCompletionMetrics {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  days_with_plans: number;
}

export interface GoalProgressMetrics {
  total_goals: number;
  completed_goals: number;
  in_progress_goals: number;
  at_risk_goals: number;
  average_progress: number;
}

export interface WeeklyReviewMetrics {
  task_completion: TaskCompletionMetrics;
  goal_progress: GoalProgressMetrics;
}

export interface WeeklyReview {
  id: number;
  week_start_date: string;
  user_id: number;
  family_id: number;
  wins: string[];
  challenges: string[];
  next_week_priorities: string[];
  lessons_learned: string | null;
  completed: boolean;
  metrics?: WeeklyReviewMetrics;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReviewsResponse {
  weekly_reviews: WeeklyReview[];
}

export interface WeeklyReviewResponse {
  weekly_review?: WeeklyReview;
  message?: string;
}

export interface UpdateWeeklyReviewData {
  wins?: string[];
  challenges?: string[];
  next_week_priorities?: string[];
  lessons_learned?: string;
  completed?: boolean;
}

// API functions
export async function getCurrentWeeklyReview(
  familyId: number,
  token: string
): Promise<WeeklyReview> {
  return apiFetch<WeeklyReview>(
    `/api/v1/families/${familyId}/weekly_reviews/current`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function getWeeklyReviews(
  familyId: number,
  token: string
): Promise<WeeklyReviewsResponse> {
  return apiFetch<WeeklyReviewsResponse>(
    `/api/v1/families/${familyId}/weekly_reviews`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function getWeeklyReview(
  familyId: number,
  reviewId: number,
  token: string
): Promise<WeeklyReview> {
  return apiFetch<WeeklyReview>(
    `/api/v1/families/${familyId}/weekly_reviews/${reviewId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function updateWeeklyReview(
  familyId: number,
  reviewId: number,
  data: UpdateWeeklyReviewData,
  token: string
): Promise<WeeklyReviewResponse> {
  return apiFetch<WeeklyReviewResponse>(
    `/api/v1/families/${familyId}/weekly_reviews/${reviewId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ weekly_review: data }),
    }
  );
}

export async function getWeeklyReviewMetrics(
  familyId: number,
  reviewId: number,
  token: string
): Promise<{ metrics: WeeklyReviewMetrics }> {
  return apiFetch<{ metrics: WeeklyReviewMetrics }>(
    `/api/v1/families/${familyId}/weekly_reviews/${reviewId}/metrics`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

// Helpers
export function formatWeekRange(weekStartDate: string): string {
  const start = new Date(weekStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const startStr = start.toLocaleDateString("en-US", options);
  const endStr = end.toLocaleDateString("en-US", {
    ...options,
    year: "numeric",
  });

  return `${startStr} - ${endStr}`;
}

export function getWeekNumber(weekStartDate: string): number {
  const date = new Date(weekStartDate);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

// Wizard steps
export interface WizardStep {
  key: string;
  title: string;
  description: string;
}

export const WEEKLY_REVIEW_STEPS: WizardStep[] = [
  {
    key: "metrics",
    title: "Metrics Overview",
    description: "Review your week by the numbers",
  },
  {
    key: "wins",
    title: "Wins",
    description: "What went well this week?",
  },
  {
    key: "challenges",
    title: "Challenges",
    description: "What was difficult this week?",
  },
  {
    key: "lessons",
    title: "Lessons Learned",
    description: "What did you learn this week?",
  },
  {
    key: "priorities",
    title: "Next Week Priorities",
    description: "What are your top priorities for next week?",
  },
];
