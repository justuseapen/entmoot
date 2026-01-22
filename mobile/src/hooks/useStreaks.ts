import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Streak types
export type StreakType =
  | "daily_planning"
  | "evening_reflection"
  | "weekly_review";

export interface Streak {
  id: number;
  streak_type: StreakType;
  current_count: number;
  longest_count: number;
  last_activity_date: string | null;
  at_risk: boolean;
  next_milestone: number;
}

export interface StreaksResponse {
  streaks: Streak[];
}

// Milestone values for special highlighting
export const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365] as const;

// Streak configuration for display
export const STREAK_CONFIG: Record<
  StreakType,
  { label: string; icon: string; description: string }
> = {
  daily_planning: {
    label: "Daily Planning",
    icon: "sunny-outline",
    description: "Days of consistent daily planning",
  },
  evening_reflection: {
    label: "Reflection",
    icon: "moon-outline",
    description: "Days of evening reflections",
  },
  weekly_review: {
    label: "Weekly Review",
    icon: "calendar-outline",
    description: "Weeks of completed reviews",
  },
};

// Query keys for cache management
export const streaksKeys = {
  all: ["streaks"] as const,
  user: () => [...streaksKeys.all, "user"] as const,
};

/**
 * Check if a streak count is at a milestone
 */
export function isStreakMilestone(count: number): boolean {
  return STREAK_MILESTONES.includes(count as (typeof STREAK_MILESTONES)[number]);
}

/**
 * Get the next milestone for a streak count
 */
export function getNextMilestone(currentCount: number): number {
  const nextMilestone = STREAK_MILESTONES.find((m) => m > currentCount);
  return nextMilestone ?? currentCount + 1;
}

/**
 * Hook to fetch user streaks
 */
export function useStreaks() {
  return useQuery({
    queryKey: streaksKeys.user(),
    queryFn: async () => {
      const response = await api.get<StreaksResponse>("/users/me/streaks");
      return response.streaks;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get a specific streak by type
 */
export function useStreak(type: StreakType) {
  const { data: streaks, ...rest } = useStreaks();
  const streak = streaks?.find((s) => s.streak_type === type);
  return { data: streak, ...rest };
}
