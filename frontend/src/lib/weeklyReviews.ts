import { apiFetch, type Mention } from "@/lib/api";

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

// Daily plan summary for weekly review
export interface DailyPlanSummary {
  id: number;
  date: string;
}

// Habit tally from daily plans (habit name -> completion count)
export interface HabitTally {
  [habitName: string]: number;
}

export interface WeeklyReview {
  id: number;
  week_start_date: string;
  user_id: number;
  family_id: number;
  // Legacy fields (kept for backward compatibility)
  wins: string[];
  challenges: string[];
  next_week_priorities: string[];
  lessons_learned: string | null;
  completed: boolean;
  // Section 0: Source Review
  source_review_completed: boolean;
  // Section 1: Review (Evidence-based)
  wins_shipped: string | null;
  losses_friction: string | null;
  // Section 2: Metrics Snapshot
  workouts_completed: number | null;
  workouts_planned: number | null;
  walks_completed: number | null;
  walks_planned: number | null;
  writing_sessions_completed: number | null;
  writing_sessions_planned: number | null;
  house_resets_completed: number | null;
  house_resets_planned: number | null;
  meals_prepped_held: boolean | null;
  metrics_notes: string | null;
  // Section 3: System Health Check
  daily_focus_used_every_day: boolean | null;
  weekly_priorities_clear: boolean | null;
  cleaning_system_held: boolean | null;
  training_volume_sustainable: boolean | null;
  system_to_adjust: string | null;
  // Section 4: Weekly Priorities
  weekly_priorities: string | null;
  // Section 5: Kill List
  kill_list: string | null;
  // Section 6: Forward Setup
  workouts_blocked: boolean;
  monday_top_3_decided: boolean;
  monday_focus_card_prepped: boolean;
  // Computed/metadata
  metrics?: WeeklyReviewMetrics;
  daily_plans: DailyPlanSummary[];
  habit_tally?: HabitTally;
  mentions?: Mention[];
  created_at: string;
  updated_at: string;
}

// Filter params for listing weekly reviews
export interface WeeklyReviewFilters {
  mentioned_by?: number;
}

export interface WeeklyReviewsResponse {
  weekly_reviews: WeeklyReview[];
}

export interface WeeklyReviewResponse {
  weekly_review?: WeeklyReview;
  message?: string;
}

export interface UpdateWeeklyReviewData {
  // Legacy fields
  wins?: string[];
  challenges?: string[];
  next_week_priorities?: string[];
  lessons_learned?: string;
  completed?: boolean;
  // Section 0: Source Review
  source_review_completed?: boolean;
  // Section 1: Review (Evidence-based)
  wins_shipped?: string;
  losses_friction?: string;
  // Section 2: Metrics Snapshot
  workouts_completed?: number;
  workouts_planned?: number;
  walks_completed?: number;
  walks_planned?: number;
  writing_sessions_completed?: number;
  writing_sessions_planned?: number;
  house_resets_completed?: number;
  house_resets_planned?: number;
  meals_prepped_held?: boolean;
  metrics_notes?: string;
  // Section 3: System Health Check
  daily_focus_used_every_day?: boolean;
  weekly_priorities_clear?: boolean;
  cleaning_system_held?: boolean;
  training_volume_sustainable?: boolean;
  system_to_adjust?: string;
  // Section 4: Weekly Priorities
  weekly_priorities?: string;
  // Section 5: Kill List
  kill_list?: string;
  // Section 6: Forward Setup
  workouts_blocked?: boolean;
  monday_top_3_decided?: boolean;
  monday_focus_card_prepped?: boolean;
}

// API functions
export async function getCurrentWeeklyReview(
  familyId: number
): Promise<WeeklyReview> {
  return apiFetch<WeeklyReview>(`/families/${familyId}/weekly_reviews/current`);
}

export async function getWeeklyReviews(
  familyId: number,
  filters?: WeeklyReviewFilters
): Promise<WeeklyReviewsResponse> {
  const params = new URLSearchParams();
  if (filters?.mentioned_by)
    params.append("mentioned_by", filters.mentioned_by.toString());

  const queryString = params.toString();
  const url = `/families/${familyId}/weekly_reviews${queryString ? `?${queryString}` : ""}`;

  return apiFetch<WeeklyReviewsResponse>(url);
}

export async function getWeeklyReview(
  familyId: number,
  reviewId: number
): Promise<WeeklyReview> {
  return apiFetch<WeeklyReview>(
    `/families/${familyId}/weekly_reviews/${reviewId}`
  );
}

export async function updateWeeklyReview(
  familyId: number,
  reviewId: number,
  data: UpdateWeeklyReviewData
): Promise<WeeklyReviewResponse> {
  return apiFetch<WeeklyReviewResponse>(
    `/families/${familyId}/weekly_reviews/${reviewId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ weekly_review: data }),
    }
  );
}

export async function getWeeklyReviewMetrics(
  familyId: number,
  reviewId: number
): Promise<{ metrics: WeeklyReviewMetrics }> {
  return apiFetch<{ metrics: WeeklyReviewMetrics }>(
    `/families/${familyId}/weekly_reviews/${reviewId}/metrics`
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
