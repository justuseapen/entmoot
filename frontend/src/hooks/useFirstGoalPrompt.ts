import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getFirstGoalPromptStatus,
  dismissFirstGoalPrompt,
} from "@/lib/firstGoalPrompt";
import type { FirstGoalPromptStatus } from "@/lib/firstGoalPrompt";

export function useFirstGoalPromptStatus() {
  const token = useAuthStore((state) => state.token);

  return useQuery<FirstGoalPromptStatus>({
    queryKey: ["firstGoalPrompt"],
    queryFn: () => {
      if (!token) throw new Error("No token");
      return getFirstGoalPromptStatus(token);
    },
    enabled: !!token,
    // Check every 30 seconds while viewing
    refetchInterval: 30000,
    // Stale time of 10 seconds - don't refetch immediately
    staleTime: 10000,
  });
}

export function useDismissFirstGoalPrompt() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!token) throw new Error("No token");
      return dismissFirstGoalPrompt(token);
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["firstGoalPrompt"] });
    },
  });
}
