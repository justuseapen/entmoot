import { apiFetch } from "./api";

// Recent mention from the API
export interface RecentMention {
  id: number;
  mentioner: {
    id: number;
    name: string;
  };
  mentionable_type: string;
  mentionable_id: number;
  mentionable_title: string | null;
  mentionable_link: string | null;
  text_field: string;
  created_at: string;
}

// Response from recent mentions endpoint
export interface RecentMentionsResponse {
  mentions: RecentMention[];
  count: number;
}

// Get recent mentions for the current user
export async function getRecentMentions(
  familyId: number
): Promise<RecentMentionsResponse> {
  return apiFetch(`/families/${familyId}/mentions/recent`);
}

// Helper to format mention time
export function formatMentionTime(createdAt: string): string {
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

// Helper to get a human-readable label for mentionable types
export function getMentionableTypeLabel(type: string): string {
  switch (type) {
    case "Goal":
      return "goal";
    case "DailyPlan":
      return "daily plan";
    case "TopPriority":
      return "priority";
    case "WeeklyReview":
      return "weekly review";
    case "MonthlyReview":
      return "monthly review";
    case "QuarterlyReview":
      return "quarterly review";
    case "AnnualReview":
      return "annual review";
    default:
      return type.toLowerCase();
  }
}
