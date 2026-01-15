import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getFirstReflectionPromptStatus,
  dismissFirstReflectionPrompt,
  submitQuickReflection,
} from "@/lib/firstReflectionPrompt";
import type { FirstReflectionPromptStatus } from "@/lib/firstReflectionPrompt";

export function useFirstReflectionPromptStatus() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<FirstReflectionPromptStatus>({
    queryKey: ["firstReflectionPrompt"],
    queryFn: () => getFirstReflectionPromptStatus(),
    enabled: isAuthenticated,
    // Only check once per session (don't refetch frequently)
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useDismissFirstReflectionPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dismissFirstReflectionPrompt(),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["firstReflectionPrompt"] });
    },
  });
}

export function useSubmitQuickReflection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      response,
      familyId,
    }: {
      response: string;
      familyId?: number;
    }) => submitQuickReflection(response, familyId),
    onSuccess: () => {
      // Invalidate the status query since user has now created a reflection
      queryClient.invalidateQueries({ queryKey: ["firstReflectionPrompt"] });
    },
  });
}
