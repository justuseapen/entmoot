import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { getPoints, type PointsResponse } from "@/lib/points";

// Query keys
export const pointsKeys = {
  all: ["points"] as const,
  summary: () => [...pointsKeys.all, "summary"] as const,
  history: (limit?: number) =>
    [...pointsKeys.all, "history", { limit }] as const,
};

// Get user's points summary (for dashboard)
export function usePoints() {
  const { token } = useAuthStore();
  return useQuery<PointsResponse>({
    queryKey: pointsKeys.summary(),
    queryFn: () => getPoints(token!, 10), // Get 10 recent activities for summary
    enabled: !!token,
    staleTime: 60000, // Cache for 1 minute
  });
}

// Get full points history
export function usePointsHistory(limit: number = 50) {
  const { token } = useAuthStore();
  return useQuery<PointsResponse>({
    queryKey: pointsKeys.history(limit),
    queryFn: () => getPoints(token!, limit),
    enabled: !!token,
    staleTime: 60000, // Cache for 1 minute
  });
}
