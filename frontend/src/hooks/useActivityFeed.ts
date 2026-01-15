import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { getActivityFeed } from "@/lib/activityFeed";

// Query keys
export const activityFeedKeys = {
  all: ["activityFeed"] as const,
  family: (familyId: number) => [...activityFeedKeys.all, familyId] as const,
};

// Activity feed query
export function useActivityFeed(familyId: number, limit: number = 10) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: activityFeedKeys.family(familyId),
    queryFn: () => getActivityFeed(familyId, limit),
    enabled: isAuthenticated && !!familyId,
    select: (data) => data.activities,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}
