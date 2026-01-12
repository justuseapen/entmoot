import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getFirstReflectionPromptStatus,
  dismissFirstReflectionPrompt,
  submitQuickReflection,
} from "@/lib/firstReflectionPrompt";
import type { FirstReflectionPromptStatus } from "@/lib/firstReflectionPrompt";

export function useFirstReflectionPromptStatus() {
  const token = useAuthStore((state) => state.token);

  return useQuery<FirstReflectionPromptStatus>({
    queryKey: ["firstReflectionPrompt"],
    queryFn: () => {
      if (!token) throw new Error("No token");
      return getFirstReflectionPromptStatus(token);
    },
    enabled: !!token,
    // Only check once per session (don't refetch frequently)
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useDismissFirstReflectionPrompt() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!token) throw new Error("No token");
      return dismissFirstReflectionPrompt(token);
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["firstReflectionPrompt"] });
    },
  });
}

export function useSubmitQuickReflection() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      response,
      familyId,
    }: {
      response: string;
      familyId?: number;
    }) => {
      if (!token) throw new Error("No token");
      return submitQuickReflection(token, response, familyId);
    },
    onSuccess: () => {
      // Invalidate the status query since user has now created a reflection
      queryClient.invalidateQueries({ queryKey: ["firstReflectionPrompt"] });
    },
  });
}
