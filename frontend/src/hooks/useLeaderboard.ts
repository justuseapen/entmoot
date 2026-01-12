import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { getLeaderboard, type LeaderboardScope } from "@/lib/leaderboard";

// Query keys
export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  list: (familyId: number, scope: LeaderboardScope) =>
    [...leaderboardKeys.all, familyId, scope] as const,
};

// Leaderboard query
export function useLeaderboard(
  familyId: number,
  scope: LeaderboardScope = "all_time"
) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: leaderboardKeys.list(familyId, scope),
    queryFn: () => getLeaderboard(familyId, token!, scope),
    enabled: !!token && !!familyId,
    select: (data) => data.leaderboard,
  });
}
