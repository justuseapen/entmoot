import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getFirstGoalPromptStatus,
  dismissFirstGoalPrompt,
} from "@/lib/firstGoalPrompt";
import type { FirstGoalPromptStatus } from "@/lib/firstGoalPrompt";

export function useFirstGoalPromptStatus() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<FirstGoalPromptStatus>({
    queryKey: ["firstGoalPrompt"],
    queryFn: () => getFirstGoalPromptStatus(),
    enabled: isAuthenticated,
    // Check every 30 seconds while viewing
    refetchInterval: 30000,
    // Stale time of 10 seconds - don't refetch immediately
    staleTime: 10000,
  });
}

export function useDismissFirstGoalPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dismissFirstGoalPrompt(),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["firstGoalPrompt"] });
    },
  });
}
