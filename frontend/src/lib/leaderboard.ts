import { apiFetch } from "./api";

// Leaderboard types
export interface LeaderboardStreaks {
  daily_planning: number;
  evening_reflection: number;
  weekly_review: number;
  total: number;
}

export interface LeaderboardEntry {
  user_id: number;
  name: string;
  avatar_url: string | null;
  points: number;
  streaks: LeaderboardStreaks;
  badges_count: number;
  rank: number;
}

export interface TopPerformer {
  user_id: number;
  name: string;
  avatar_url: string | null;
  points: number;
}

export interface EncouragementMessage {
  user_id: number;
  message: string;
}

export interface LeaderboardData {
  scope: "all_time" | "weekly";
  entries: LeaderboardEntry[];
  top_performer: TopPerformer | null;
  encouragement_messages: EncouragementMessage[];
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardData;
}

export type LeaderboardScope = "all_time" | "weekly";

// Get family leaderboard
export async function getLeaderboard(
  familyId: number,
  token: string,
  scope: LeaderboardScope = "all_time"
): Promise<LeaderboardResponse> {
  return apiFetch(`/api/v1/families/${familyId}/leaderboard?scope=${scope}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Helper to format rank with suffix
export function formatRank(rank: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = rank % 100;
  return rank + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

// Get rank badge color
export function getRankBadgeColor(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case 2:
      return "bg-gray-100 text-gray-800 border-gray-300";
    case 3:
      return "bg-orange-100 text-orange-800 border-orange-300";
    default:
      return "bg-blue-50 text-blue-800 border-blue-200";
  }
}

// Get rank icon
export function getRankIcon(rank: number): string {
  switch (rank) {
    case 1:
      return "gold";
    case 2:
      return "silver";
    case 3:
      return "bronze";
    default:
      return "";
  }
}
