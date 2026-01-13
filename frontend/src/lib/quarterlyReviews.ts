import { apiFetch } from "@/lib/api";

// Types
export interface GoalCompletionMetrics {
  total_goals: number;
  completed_goals: number;
  completion_rate: number;
}

export interface MonthlyReviewCompletionMetrics {
  total_months: number;
  completed_months: number;
  completion_rate: number;
}

export interface HabitConsistencyMetrics {
  total_weeks: number;
  completed_weeks: number;
  consistency_rate: number;
}

export interface QuarterlyReviewMetrics {
  goal_completion: GoalCompletionMetrics;
  monthly_review_completion: MonthlyReviewCompletionMetrics;
  habit_consistency: HabitConsistencyMetrics;
}

export interface QuarterlyReview {
  id: number;
  quarter_start_date: string;
  user_id: number;
  family_id: number;
  achievements: string[];
  obstacles: string[];
  insights: string | null;
  next_quarter_objectives: string[];
  completed: boolean;
  metrics?: QuarterlyReviewMetrics;
  created_at: string;
  updated_at: string;
}

export interface QuarterlyReviewsResponse {
  quarterly_reviews: QuarterlyReview[];
}

export interface QuarterlyReviewResponse {
  quarterly_review?: QuarterlyReview;
  message?: string;
}

export interface UpdateQuarterlyReviewData {
  achievements?: string[];
  obstacles?: string[];
  insights?: string;
  next_quarter_objectives?: string[];
  completed?: boolean;
}

// API functions
export async function getCurrentQuarterlyReview(
  familyId: number,
  token: string
): Promise<QuarterlyReview> {
  return apiFetch<QuarterlyReview>(
    `/api/v1/families/${familyId}/quarterly_reviews/current`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function getQuarterlyReviews(
  familyId: number,
  token: string
): Promise<QuarterlyReviewsResponse> {
  return apiFetch<QuarterlyReviewsResponse>(
    `/api/v1/families/${familyId}/quarterly_reviews`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function getQuarterlyReview(
  familyId: number,
  reviewId: number,
  token: string
): Promise<QuarterlyReview> {
  return apiFetch<QuarterlyReview>(
    `/api/v1/families/${familyId}/quarterly_reviews/${reviewId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function updateQuarterlyReview(
  familyId: number,
  reviewId: number,
  data: UpdateQuarterlyReviewData,
  token: string
): Promise<QuarterlyReviewResponse> {
  return apiFetch<QuarterlyReviewResponse>(
    `/api/v1/families/${familyId}/quarterly_reviews/${reviewId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quarterly_review: data }),
    }
  );
}

export async function getQuarterlyReviewMetrics(
  familyId: number,
  reviewId: number,
  token: string
): Promise<{ metrics: QuarterlyReviewMetrics }> {
  return apiFetch<{ metrics: QuarterlyReviewMetrics }>(
    `/api/v1/families/${familyId}/quarterly_reviews/${reviewId}/metrics`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

// Helpers
export function formatQuarterYear(quarterStartDate: string): string {
  const date = new Date(quarterStartDate);
  const month = date.getMonth();
  const year = date.getFullYear();

  // Determine quarter based on month
  let quarter: string;
  if (month >= 0 && month <= 2) {
    quarter = "Q1";
  } else if (month >= 3 && month <= 5) {
    quarter = "Q2";
  } else if (month >= 6 && month <= 8) {
    quarter = "Q3";
  } else {
    quarter = "Q4";
  }

  return `${quarter} ${year}`;
}

export function getQuarterName(quarterStartDate: string): string {
  const date = new Date(quarterStartDate);
  const month = date.getMonth();

  if (month >= 0 && month <= 2) {
    return "First Quarter";
  } else if (month >= 3 && month <= 5) {
    return "Second Quarter";
  } else if (month >= 6 && month <= 8) {
    return "Third Quarter";
  } else {
    return "Fourth Quarter";
  }
}

export function formatQuarterShort(quarterStartDate: string): string {
  const date = new Date(quarterStartDate);
  const month = date.getMonth();
  const year = date.getFullYear();

  let quarter: string;
  if (month >= 0 && month <= 2) {
    quarter = "Q1";
  } else if (month >= 3 && month <= 5) {
    quarter = "Q2";
  } else if (month >= 6 && month <= 8) {
    quarter = "Q3";
  } else {
    quarter = "Q4";
  }

  return `${quarter} '${year.toString().slice(-2)}`;
}

export function getQuarterDateRange(quarterStartDate: string): string {
  const date = new Date(quarterStartDate);
  const month = date.getMonth();
  const year = date.getFullYear();

  let startMonth: string;
  let endMonth: string;

  if (month >= 0 && month <= 2) {
    startMonth = "January";
    endMonth = "March";
  } else if (month >= 3 && month <= 5) {
    startMonth = "April";
    endMonth = "June";
  } else if (month >= 6 && month <= 8) {
    startMonth = "July";
    endMonth = "September";
  } else {
    startMonth = "October";
    endMonth = "December";
  }

  return `${startMonth} - ${endMonth} ${year}`;
}

// Wizard steps
export interface WizardStep {
  key: string;
  title: string;
  description: string;
}

export const QUARTERLY_REVIEW_STEPS: WizardStep[] = [
  {
    key: "metrics",
    title: "Quarter Metrics",
    description: "Review your quarter by the numbers",
  },
  {
    key: "achievements",
    title: "Achievements",
    description: "What did you achieve this quarter?",
  },
  {
    key: "obstacles",
    title: "Obstacles",
    description: "What obstacles did you face?",
  },
  {
    key: "insights",
    title: "Insights",
    description: "What key insights did you gain?",
  },
  {
    key: "objectives",
    title: "Next Quarter Objectives",
    description: "What will you focus on next quarter?",
  },
];
