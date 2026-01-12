import { useContext, useCallback } from "react";
import { useNPSPromptState, useFeatureFeedbackState } from "./useFeedback";
import {
  ProactiveFeedbackContext,
  type ProactiveFeedbackContextType,
} from "@/contexts/ProactiveFeedbackContext";

export type { ProactiveFeedbackContextType };

export function useProactiveFeedback() {
  const context = useContext(ProactiveFeedbackContext);
  if (!context) {
    throw new Error(
      "useProactiveFeedback must be used within ProactiveFeedbackProvider"
    );
  }
  return context;
}

// Hook for components that want to trigger NPS after certain conditions
export function useNPSTrigger() {
  const { showNPSSurvey } = useProactiveFeedback();
  const { shouldShowNPS } = useNPSPromptState();

  const triggerNPSIfEligible = useCallback(() => {
    if (shouldShowNPS) {
      // Small delay to not interrupt the user's flow
      setTimeout(() => {
        showNPSSurvey();
      }, 2000);
    }
  }, [shouldShowNPS, showNPSSurvey]);

  return { triggerNPSIfEligible, isEligible: shouldShowNPS };
}

// Convenience hook for feature feedback after first use
export function useFeatureFeedbackTrigger(
  feature: string,
  featureLabel: string
) {
  const { triggerFeatureFeedbackCheck } = useProactiveFeedback();
  const { isFeatureRated } = useFeatureFeedbackState(feature);

  const triggerFeedback = useCallback(() => {
    if (!isFeatureRated) {
      triggerFeatureFeedbackCheck(feature, featureLabel);
    }
  }, [isFeatureRated, feature, featureLabel, triggerFeatureFeedbackCheck]);

  return { triggerFeedback, alreadyRated: isFeatureRated };
}

// Convenience hook for session feedback after flow completion
export function useSessionFeedbackTrigger(flowType: string, flowLabel: string) {
  const { checkAndShowSessionFeedback } = useProactiveFeedback();

  const triggerSessionFeedback = useCallback(() => {
    return checkAndShowSessionFeedback(flowType, flowLabel);
  }, [checkAndShowSessionFeedback, flowType, flowLabel]);

  return { triggerSessionFeedback };
}
