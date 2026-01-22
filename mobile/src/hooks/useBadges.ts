import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Badge types
export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: string;
  earned: boolean;
  earned_at: string | null;
  points_awarded?: number;
}

export interface BadgeStats {
  total_badges: number;
  earned_badges: number;
  completion_percentage: number;
}

export interface UserBadgesResponse {
  badges: Badge[];
  stats: BadgeStats;
}

export interface AllBadgesResponse {
  badges: Badge[];
}

// Badge categories for display
export type BadgeCategory =
  | "streak"
  | "achievement"
  | "milestone"
  | "special"
  | "community";

// Query keys for cache management
export const badgesKeys = {
  all: ["badges"] as const,
  userBadges: () => [...badgesKeys.all, "user"] as const,
  allBadges: () => [...badgesKeys.all, "catalog"] as const,
  badge: (id: number) => [...badgesKeys.all, "detail", id] as const,
};

// Badge category configuration
export const BADGE_CATEGORIES: Record<
  BadgeCategory,
  { label: string; icon: string; color: string }
> = {
  streak: {
    label: "Streak",
    icon: "flame-outline",
    color: "#F97316", // Orange
  },
  achievement: {
    label: "Achievement",
    icon: "trophy-outline",
    color: "#EAB308", // Yellow/Gold
  },
  milestone: {
    label: "Milestone",
    icon: "flag-outline",
    color: "#8B5CF6", // Purple
  },
  special: {
    label: "Special",
    icon: "star-outline",
    color: "#EC4899", // Pink
  },
  community: {
    label: "Community",
    icon: "people-outline",
    color: "#06B6D4", // Cyan
  },
};

/**
 * Get the category config for a badge
 */
export function getBadgeCategoryConfig(category: string) {
  const normalizedCategory = category.toLowerCase() as BadgeCategory;
  return (
    BADGE_CATEGORIES[normalizedCategory] ??
    BADGE_CATEGORIES.achievement // Default fallback
  );
}

/**
 * Check if a badge is newly earned (within last 24 hours)
 */
export function isNewlyEarned(badge: Badge): boolean {
  if (!badge.earned || !badge.earned_at) return false;
  const earnedDate = new Date(badge.earned_at);
  const now = new Date();
  const hoursSinceEarned =
    (now.getTime() - earnedDate.getTime()) / (1000 * 60 * 60);
  return hoursSinceEarned < 24;
}

/**
 * Format earned date for display
 */
export function formatEarnedDate(earnedAt: string | null): string {
  if (!earnedAt) return "";
  const date = new Date(earnedAt);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Hook to fetch user's badges (earned and available)
 */
export function useUserBadges() {
  return useQuery({
    queryKey: badgesKeys.userBadges(),
    queryFn: async () => {
      const response = await api.get<UserBadgesResponse>("/users/me/badges");
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch all available badges in the system
 */
export function useAllBadges() {
  return useQuery({
    queryKey: badgesKeys.allBadges(),
    queryFn: async () => {
      const response = await api.get<AllBadgesResponse>("/badges");
      return response.badges;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - badges catalog doesn't change often
  });
}

/**
 * Get earned badges sorted by earned date (most recent first)
 */
export function getEarnedBadges(badges: Badge[]): Badge[] {
  return badges
    .filter((b) => b.earned)
    .sort((a, b) => {
      // Sort by earned_at descending (most recent first)
      if (!a.earned_at) return 1;
      if (!b.earned_at) return -1;
      return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime();
    });
}

/**
 * Get unearned (locked) badges
 */
export function getLockedBadges(badges: Badge[]): Badge[] {
  return badges.filter((b) => !b.earned);
}

/**
 * Group badges by category
 */
export function groupBadgesByCategory(
  badges: Badge[]
): Record<string, Badge[]> {
  return badges.reduce(
    (groups, badge) => {
      const category = badge.category || "achievement";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(badge);
      return groups;
    },
    {} as Record<string, Badge[]>
  );
}
