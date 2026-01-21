import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { useFamilyStore } from "@/stores/family";
import { getRecentMentions, type RecentMentionsResponse } from "@/lib/mentions";

// Query keys
export const mentionsKeys = {
  all: ["mentions"] as const,
  recent: (familyId: number) =>
    [...mentionsKeys.all, "recent", familyId] as const,
};

// Get recent mentions for the current user in the current family
export function useRecentMentions() {
  const { isAuthenticated } = useAuthStore();
  const { currentFamily } = useFamilyStore();
  const familyId = currentFamily?.id;

  return useQuery<RecentMentionsResponse>({
    queryKey: mentionsKeys.recent(familyId ?? 0),
    queryFn: () => getRecentMentions(familyId!),
    enabled: isAuthenticated && !!familyId,
    // Refetch every 60 seconds to get new mentions
    refetchInterval: 60000,
    // Keep showing stale data while refetching
    staleTime: 30000,
  });
}
