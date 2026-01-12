import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { getStreaks, type StreaksResponse } from "@/lib/streaks";

// Query keys
export const streaksKeys = {
  all: ["streaks"] as const,
  list: () => [...streaksKeys.all, "list"] as const,
};

// Get user's streaks
export function useStreaks() {
  const { token } = useAuthStore();
  return useQuery<StreaksResponse>({
    queryKey: streaksKeys.list(),
    queryFn: () => getStreaks(token!),
    enabled: !!token,
    staleTime: 60000, // Cache for 1 minute
  });
}
