import { createContext } from "react";

export interface ProactiveFeedbackContextType {
  showNPSSurvey: () => void;
  showFeatureFeedback: (feature: string, featureLabel: string) => void;
  checkAndShowSessionFeedback: (flowType: string, flowLabel: string) => boolean;
  triggerFeatureFeedbackCheck: (feature: string, featureLabel: string) => void;
}

export const ProactiveFeedbackContext =
  createContext<ProactiveFeedbackContextType | null>(null);
