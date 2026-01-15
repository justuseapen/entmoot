import { apiFetch } from "./api";

// Activity types
export type ActivityType =
  | "complete_task"
  | "complete_daily_plan"
  | "complete_reflection"
  | "complete_weekly_review"
  | "create_goal"
  | "complete_goal"
  | "earn_badge"
  | "streak_milestone";

export interface PointsBreakdown {
  activity_type: string;
  total: number;
}

export interface PointsData {
  total: number;
  this_week: number;
  breakdown: PointsBreakdown[];
}

export interface PointsActivity {
  id: number;
  points: number;
  activity_type: ActivityType;
  activity_label: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PointsResponse {
  points: PointsData;
  recent_activity: PointsActivity[];
}

// Get user's points and recent activity
export async function getPoints(limit?: number): Promise<PointsResponse> {
  const params = limit ? `?limit=${limit}` : "";
  return apiFetch(`/users/me/points${params}`);
}

// Point values for display
export const POINT_VALUES: Record<ActivityType, number> = {
  complete_task: 5,
  complete_daily_plan: 10,
  complete_reflection: 20,
  complete_weekly_review: 50,
  create_goal: 15,
  complete_goal: 30,
  earn_badge: 25,
  streak_milestone: 50,
};

// Get activity label
export function getActivityLabel(activityType: ActivityType): string {
  switch (activityType) {
    case "complete_task":
      return "Completed task";
    case "complete_daily_plan":
      return "Completed daily plan";
    case "complete_reflection":
      return "Completed reflection";
    case "complete_weekly_review":
      return "Completed weekly review";
    case "create_goal":
      return "Created a goal";
    case "complete_goal":
      return "Completed a goal";
    case "earn_badge":
      return "Earned a badge";
    case "streak_milestone":
      return "Streak milestone";
    default:
      return activityType;
  }
}

// Get activity emoji
export function getActivityEmoji(activityType: ActivityType): string {
  switch (activityType) {
    case "complete_task":
      return "✅";
    case "complete_daily_plan":
      return "📋";
    case "complete_reflection":
      return "🌙";
    case "complete_weekly_review":
      return "📊";
    case "create_goal":
      return "🎯";
    case "complete_goal":
      return "🏆";
    case "earn_badge":
      return "🎖️";
    case "streak_milestone":
      return "🔥";
    default:
      return "⭐";
  }
}

// Format points with + sign
export function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : `${points}`;
}

// Format activity time
export function formatActivityTime(createdAt: string): string {
  const now = new Date();
  const date = new Date(createdAt);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}
