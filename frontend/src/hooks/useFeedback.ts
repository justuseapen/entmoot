import { useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  createFeedback,
  getFeedback,
  getFeedbackEligibility,
  dismissNPS,
  getNPSFollowUp,
  submitNPSFeedback,
  submitFeatureFeedback,
  submitSessionFeedback,
  type CreateFeedbackData,
  type CreateFeedbackResponse,
  type GetFeedbackResponse,
  type FeedbackEligibility,
  type NPSFollowUpResponse,
  type DismissNPSResponse,
  type SessionRating,
} from "@/lib/feedback";

export function useCreateFeedback() {
  const { token } = useAuthStore();

  return useMutation<CreateFeedbackResponse, Error, CreateFeedbackData>({
    mutationFn: (data) => createFeedback(data, token ?? undefined),
  });
}

export function useGetFeedback(id: number | null) {
  const { token } = useAuthStore();

  return useQuery<GetFeedbackResponse, Error>({
    queryKey: ["feedback", id],
    queryFn: () => getFeedback(id!, token!),
    enabled: !!id && !!token,
  });
}

// Hook for keyboard shortcut: Cmd/Ctrl + Shift + F
export function useFeedbackShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key === "f"
      ) {
        event.preventDefault();
        onOpen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}

// Hook to check feedback eligibility (NPS, etc.)
export function useFeedbackEligibility() {
  const { token, isAuthenticated } = useAuthStore();

  return useQuery<FeedbackEligibility, Error>({
    queryKey: ["feedbackEligibility"],
    queryFn: () => getFeedbackEligibility(token!),
    enabled: isAuthenticated && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook to get NPS follow-up question based on score
export function useNPSFollowUp(score: number | null) {
  const { token } = useAuthStore();

  return useQuery<NPSFollowUpResponse, Error>({
    queryKey: ["npsFollowUp", score],
    queryFn: () => getNPSFollowUp(score!, token!),
    enabled: score !== null && !!token,
  });
}

// Hook to dismiss NPS prompt
export function useDismissNPS() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation<DismissNPSResponse, Error>({
    mutationFn: () => dismissNPS(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbackEligibility"] });
    },
  });
}

// Hook to submit NPS feedback
export function useSubmitNPS() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation<
    CreateFeedbackResponse,
    Error,
    { score: number; followUp: string }
  >({
    mutationFn: ({ score, followUp }) =>
      submitNPSFeedback(score, followUp, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbackEligibility"] });
    },
  });
}

// Hook to submit feature feedback (thumbs up/down)
export function useSubmitFeatureFeedback() {
  const { token } = useAuthStore();

  return useMutation<
    CreateFeedbackResponse,
    Error,
    { feature: string; rating: "positive" | "negative"; feedback?: string }
  >({
    mutationFn: ({ feature, rating, feedback }) =>
      submitFeatureFeedback(feature, rating, feedback, token!),
  });
}

// Hook to submit session feedback (emoji rating)
export function useSubmitSessionFeedback() {
  const { token } = useAuthStore();

  return useMutation<
    CreateFeedbackResponse,
    Error,
    { flowType: string; rating: SessionRating; feedback?: string }
  >({
    mutationFn: ({ flowType, rating, feedback }) =>
      submitSessionFeedback(flowType, rating, feedback, token!),
  });
}

// Local storage keys for tracking feedback prompts
const NPS_DISMISSED_KEY = "entmoot_nps_dismissed";
const FEATURE_FEEDBACK_KEY = "entmoot_feature_feedback";
const SESSION_FEEDBACK_KEY = "entmoot_session_feedback";

// Hook to manage NPS prompt visibility with local fallback
export function useNPSPromptState() {
  const { data: eligibility } = useFeedbackEligibility();
  const dismissNPSMutation = useDismissNPS();

  const isDismissedLocally = useCallback(() => {
    const dismissed = localStorage.getItem(NPS_DISMISSED_KEY);
    if (!dismissed) return false;

    const dismissedDate = new Date(dismissed);
    const daysSinceDismissal = Math.floor(
      (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Respect 90-day quarterly limit locally as well
    return daysSinceDismissal < 90;
  }, []);

  const shouldShowNPS = eligibility?.nps_eligible && !isDismissedLocally();

  const dismissNPS = useCallback(() => {
    localStorage.setItem(NPS_DISMISSED_KEY, new Date().toISOString());
    dismissNPSMutation.mutate();
  }, [dismissNPSMutation]);

  return { shouldShowNPS, dismissNPS };
}

// Hook to track feature feedback shown status
export function useFeatureFeedbackState(feature: string) {
  const getShownFeatures = useCallback((): string[] => {
    const stored = localStorage.getItem(FEATURE_FEEDBACK_KEY);
    return stored ? JSON.parse(stored) : [];
  }, []);

  const isFeatureRated = useCallback(() => {
    return getShownFeatures().includes(feature);
  }, [feature, getShownFeatures]);

  const markFeatureRated = useCallback(() => {
    const features = getShownFeatures();
    if (!features.includes(feature)) {
      features.push(feature);
      localStorage.setItem(FEATURE_FEEDBACK_KEY, JSON.stringify(features));
    }
  }, [feature, getShownFeatures]);

  return { isFeatureRated: isFeatureRated(), markFeatureRated };
}

// Hook to manage session feedback probability
export function useSessionFeedbackState(flowType: string) {
  const getSessionCount = useCallback((): number => {
    const stored = localStorage.getItem(SESSION_FEEDBACK_KEY);
    const counts = stored ? JSON.parse(stored) : {};
    return counts[flowType] || 0;
  }, [flowType]);

  const incrementSessionCount = useCallback(() => {
    const stored = localStorage.getItem(SESSION_FEEDBACK_KEY);
    const counts = stored ? JSON.parse(stored) : {};
    counts[flowType] = (counts[flowType] || 0) + 1;
    localStorage.setItem(SESSION_FEEDBACK_KEY, JSON.stringify(counts));
    return counts[flowType];
  }, [flowType]);

  // Show session feedback approximately 1 in 5 times
  const shouldShowSessionFeedback = useCallback(() => {
    const count = incrementSessionCount();
    return count > 0 && count % 5 === 0;
  }, [incrementSessionCount]);

  return { shouldShowSessionFeedback, sessionCount: getSessionCount() };
}
