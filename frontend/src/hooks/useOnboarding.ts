import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useOnboardingStore, type OnboardingStatus } from "@/stores/onboarding";

export function useOnboardingStatus() {
  const { setStatus, setLoading, setError } = useOnboardingStore();

  return useQuery({
    queryKey: ["onboarding", "status"],
    queryFn: async () => {
      setLoading(true);
      try {
        const data = await apiFetch<OnboardingStatus>("/onboarding/status");
        setStatus(data);
        setError(null);
        return data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to fetch status";
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateOnboardingStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stepName,
      data,
    }: {
      stepName: string;
      data?: Record<string, unknown>;
    }) => {
      return apiFetch<{ message: string; next_step: number; completed_at?: string }>(
        `/onboarding/step/${stepName}`,
        {
          method: "POST",
          body: data ? JSON.stringify(data) : undefined,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"] });
    },
  });
}

export function useSkipOnboardingStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stepName: string) => {
      return apiFetch<{
        message: string;
        skipped_steps: string[];
        next_step: number;
      }>(`/onboarding/skip/${stepName}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"] });
    },
  });
}

export function useCalendarWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: "apple" | "microsoft") => {
      return apiFetch<{
        message: string;
        calendar_waitlist: Record<string, string>;
      }>("/calendar_waitlist", {
        method: "POST",
        body: JSON.stringify({ provider }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"] });
    },
  });
}

export function useAutoCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiFetch<{
        message: string;
        completed_at: string;
      }>("/onboarding/auto_complete", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
