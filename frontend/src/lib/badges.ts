import { apiFetch } from "./api";

// Badge types
export type BadgeCategory =
  | "goals"
  | "planning"
  | "reflection"
  | "streaks"
  | "general";

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  criteria?: Record<string, unknown>;
}

export interface UserBadge extends Badge {
  earned: boolean;
  earned_at: string | null;
}

export interface BadgeStats {
  total_badges: number;
  earned_badges: number;
  completion_percentage: number;
}

export interface AllBadgesResponse {
  badges: Badge[];
}

export interface UserBadgesResponse {
  badges: UserBadge[];
  stats: BadgeStats;
}

// Get all available badges
export async function getAllBadges(): Promise<AllBadgesResponse> {
  return apiFetch("/badges");
}

// Get user's badges with earned status
export async function getUserBadges(): Promise<UserBadgesResponse> {
  return apiFetch("/users/me/badges");
}

// Helper to get category label
export function getCategoryLabel(category: BadgeCategory): string {
  switch (category) {
    case "goals":
      return "Goals";
    case "planning":
      return "Planning";
    case "reflection":
      return "Reflection";
    case "streaks":
      return "Streaks";
    case "general":
      return "General";
    default:
      return category;
  }
}

// Helper to get category color
export function getCategoryColor(category: BadgeCategory): string {
  switch (category) {
    case "goals":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "planning":
      return "bg-green-100 text-green-800 border-green-200";
    case "reflection":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "streaks":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "general":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

// Group badges by category
export function groupBadgesByCategory(
  badges: UserBadge[]
): Record<BadgeCategory, UserBadge[]> {
  const grouped: Record<BadgeCategory, UserBadge[]> = {
    goals: [],
    planning: [],
    reflection: [],
    streaks: [],
    general: [],
  };

  badges.forEach((badge) => {
    if (grouped[badge.category]) {
      grouped[badge.category].push(badge);
    }
  });

  return grouped;
}

// Get earned badges only
export function getEarnedBadges(badges: UserBadge[]): UserBadge[] {
  return badges.filter((badge) => badge.earned);
}

// Get unearned badges only
export function getUnearnedBadges(badges: UserBadge[]): UserBadge[] {
  return badges.filter((badge) => !badge.earned);
}

// Format earned date
export function formatEarnedDate(earnedAt: string | null): string {
  if (!earnedAt) return "";
  const date = new Date(earnedAt);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
