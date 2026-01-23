import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Types
export interface PointsBreakdown {
  habits?: number;
  tasks?: number;
  goals?: number;
  reflections?: number;
  reviews?: number;
  streaks?: number;
  badges?: number;
  [key: string]: number | undefined;
}

export interface PointsTotal {
  total: number;
  this_week: number;
  breakdown: PointsBreakdown;
}

export interface RecentActivity {
  id: number;
  activity_type: string;
  activity_label: string;
  points: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface PointsResponse {
  points: PointsTotal;
  recent_activity: RecentActivity[];
}

// Query keys
export const pointsKeys = {
  all: ["points"] as const,
  me: ["points", "me"] as const,
};

// Activity type to icon mapping
export const ACTIVITY_ICONS: Record<string, string> = {
  habit_completed: "checkmark-circle",
  task_completed: "checkbox",
  goal_completed: "trophy",
  goal_progress: "trending-up",
  reflection_created: "journal",
  weekly_review_completed: "calendar",
  streak_milestone: "flame",
  badge_earned: "ribbon",
  daily_plan_completed: "today",
  first_action: "star",
  default: "flash",
};

// Get icon for activity type
export function getActivityIcon(activityType: string): string {
  return ACTIVITY_ICONS[activityType] || ACTIVITY_ICONS.default;
}

// Format relative timestamp
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "Just now";
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay === 1) {
    return "Yesterday";
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

// Hooks
export function usePoints() {
  return useQuery({
    queryKey: pointsKeys.me,
    queryFn: async () => {
      const response = await api.get<PointsResponse>("/users/me/points");
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Export a hook specifically for recent activity with limit parameter
export function useRecentActivity(limit: number = 10) {
  const { data, ...rest } = usePoints();
  return {
    ...rest,
    data: data?.recent_activity.slice(0, limit),
  };
}
