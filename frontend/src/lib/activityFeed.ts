import { apiFetch } from "./api";

// Activity user info
export interface ActivityUser {
  id: number;
  name: string;
  avatar_url: string | null;
}

// Activity metadata can vary by type
export interface ActivityMetadata {
  goal_id?: number;
  goal_title?: string;
  badge_id?: number;
  badge_name?: string;
  badge_icon?: string;
  reflection_id?: number;
  streak_type?: string;
  days?: number;
  [key: string]: unknown;
}

// Activity types
export type ActivityType =
  | "goal_created"
  | "goal_completed"
  | "badge_earned"
  | "streak_milestone"
  | "reflection_completed";

// Activity item
export interface Activity {
  type: ActivityType;
  user: ActivityUser;
  description: string;
  timestamp: string;
  metadata: ActivityMetadata;
}

// API response
export interface ActivityFeedResponse {
  activities: Activity[];
}

// API functions
export async function getActivityFeed(
  familyId: number,
  limit: number = 10
): Promise<ActivityFeedResponse> {
  return apiFetch<ActivityFeedResponse>(
    `/families/${familyId}/activity_feed?limit=${limit}`
  );
}

// Helper functions
export function getActivityIcon(type: ActivityType): string {
  switch (type) {
    case "goal_created":
      return "🎯";
    case "goal_completed":
      return "✅";
    case "badge_earned":
      return "🏆";
    case "streak_milestone":
      return "🔥";
    case "reflection_completed":
      return "✨";
    default:
      return "📌";
  }
}

export function getActivityColor(type: ActivityType): string {
  switch (type) {
    case "goal_created":
      return "text-blue-600";
    case "goal_completed":
      return "text-green-600";
    case "badge_earned":
      return "text-yellow-600";
    case "streak_milestone":
      return "text-orange-600";
    case "reflection_completed":
      return "text-purple-600";
    default:
      return "text-gray-600";
  }
}

export function formatActivityTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }
}
