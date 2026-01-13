import { apiFetch } from "@/lib/api";

// Types
export interface GoalsAchievedMetrics {
  total_goals: number;
  completed_goals: number;
  completion_rate: number;
}

export interface StreaksMaintainedMetrics {
  daily_planning_longest: number;
  evening_reflection_longest: number;
  weekly_review_longest: number;
}

export interface ReviewConsistencyMetrics {
  quarterly_reviews: {
    total: number;
    completed: number;
    completion_rate: number;
  };
  monthly_reviews: {
    total: number;
    completed: number;
    completion_rate: number;
  };
  weekly_reviews: {
    total: number;
    completed: number;
    completion_rate: number;
  };
}

export interface AnnualReviewMetrics {
  goals_achieved: GoalsAchievedMetrics;
  streaks_maintained: StreaksMaintainedMetrics;
  review_consistency: ReviewConsistencyMetrics;
}

export interface AnnualReview {
  id: number;
  year: number;
  user_id: number;
  family_id: number;
  year_highlights: string[];
  year_challenges: string[];
  lessons_learned: string | null;
  gratitude: string[];
  next_year_theme: string | null;
  next_year_goals: string[];
  completed: boolean;
  metrics?: AnnualReviewMetrics;
  created_at: string;
  updated_at: string;
}

export interface AnnualReviewsResponse {
  annual_reviews: AnnualReview[];
}

export interface AnnualReviewResponse {
  annual_review?: AnnualReview;
  message?: string;
}

export interface UpdateAnnualReviewData {
  year_highlights?: string[];
  year_challenges?: string[];
  lessons_learned?: string;
  gratitude?: string[];
  next_year_theme?: string;
  next_year_goals?: string[];
  completed?: boolean;
}

// API functions
export async function getCurrentAnnualReview(
  familyId: number,
  token: string
): Promise<AnnualReview> {
  return apiFetch<AnnualReview>(
    `/api/v1/families/${familyId}/annual_reviews/current`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function getAnnualReviews(
  familyId: number,
  token: string
): Promise<AnnualReviewsResponse> {
  return apiFetch<AnnualReviewsResponse>(
    `/api/v1/families/${familyId}/annual_reviews`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function getAnnualReview(
  familyId: number,
  reviewId: number,
  token: string
): Promise<AnnualReview> {
  return apiFetch<AnnualReview>(
    `/api/v1/families/${familyId}/annual_reviews/${reviewId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function updateAnnualReview(
  familyId: number,
  reviewId: number,
  data: UpdateAnnualReviewData,
  token: string
): Promise<AnnualReviewResponse> {
  return apiFetch<AnnualReviewResponse>(
    `/api/v1/families/${familyId}/annual_reviews/${reviewId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ annual_review: data }),
    }
  );
}

export async function getAnnualReviewMetrics(
  familyId: number,
  reviewId: number,
  token: string
): Promise<{ metrics: AnnualReviewMetrics }> {
  return apiFetch<{ metrics: AnnualReviewMetrics }>(
    `/api/v1/families/${familyId}/annual_reviews/${reviewId}/metrics`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

// Helpers
export function formatYear(year: number): string {
  return year.toString();
}

export function getYearName(year: number): string {
  return `Year ${year}`;
}

export function formatYearShort(year: number): string {
  return `'${year.toString().slice(-2)}`;
}

export function getYearDateRange(year: number): string {
  return `January - December ${year}`;
}

// Wizard steps
export interface WizardStep {
  key: string;
  title: string;
  description: string;
}

export const ANNUAL_REVIEW_STEPS: WizardStep[] = [
  {
    key: "metrics",
    title: "Year Metrics",
    description: "Review your year by the numbers",
  },
  {
    key: "highlights",
    title: "Year Highlights",
    description: "What were your highlights this year?",
  },
  {
    key: "challenges",
    title: "Year Challenges",
    description: "What challenges did you face?",
  },
  {
    key: "lessons",
    title: "Lessons Learned",
    description: "What lessons did you learn?",
  },
  {
    key: "gratitude",
    title: "Gratitude",
    description: "What are you grateful for?",
  },
  {
    key: "theme",
    title: "Next Year Theme",
    description: "What theme will guide your next year?",
  },
  {
    key: "goals",
    title: "Next Year Goals",
    description: "What goals will you pursue next year?",
  },
];
