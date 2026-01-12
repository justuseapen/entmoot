import { useState, useCallback, type ReactNode } from "react";
import { NPSSurvey } from "./NPSSurvey";
import { SessionFeedback } from "./SessionFeedback";
import { FeatureFeedbackToast } from "./FeatureFeedback";
import { useNPSPromptState } from "@/hooks/useFeedback";
import { ProactiveFeedbackContext } from "@/contexts/ProactiveFeedbackContext";

interface ProactiveFeedbackProviderProps {
  children: ReactNode;
}

export function ProactiveFeedbackProvider({
  children,
}: ProactiveFeedbackProviderProps) {
  // NPS state
  const [npsOpen, setNPSOpen] = useState(false);
  const { shouldShowNPS, dismissNPS } = useNPSPromptState();

  // Feature feedback state
  const [featureFeedback, setFeatureFeedback] = useState<{
    feature: string;
    label: string;
    show: boolean;
  } | null>(null);

  // Session feedback state
  const [sessionFeedback, setSessionFeedback] = useState<{
    flowType: string;
    label: string;
    open: boolean;
  } | null>(null);

  // Show NPS survey (can be called manually or triggered automatically)
  const showNPSSurvey = useCallback(() => {
    if (shouldShowNPS) {
      setNPSOpen(true);
    }
  }, [shouldShowNPS]);

  // Show feature feedback toast
  const showFeatureFeedback = useCallback(
    (feature: string, featureLabel: string) => {
      setFeatureFeedback({ feature, label: featureLabel, show: true });
    },
    []
  );

  // Check and optionally show session feedback (returns true if shown)
  const checkAndShowSessionFeedback = useCallback(
    (flowType: string, flowLabel: string): boolean => {
      // Create inline hook-like behavior for session feedback
      const stored = localStorage.getItem("entmoot_session_feedback");
      const counts: Record<string, number> = stored ? JSON.parse(stored) : {};
      const currentCount = (counts[flowType] || 0) + 1;

      // Update count
      counts[flowType] = currentCount;
      localStorage.setItem("entmoot_session_feedback", JSON.stringify(counts));

      // Show feedback approximately 1 in 5 times (on 5th, 10th, 15th, etc.)
      if (currentCount > 0 && currentCount % 5 === 0) {
        setSessionFeedback({ flowType, label: flowLabel, open: true });
        return true;
      }

      return false;
    },
    []
  );

  // Trigger feature feedback check (shows if not already rated)
  const triggerFeatureFeedbackCheck = useCallback(
    (feature: string, featureLabel: string) => {
      const stored = localStorage.getItem("entmoot_feature_feedback");
      const features: string[] = stored ? JSON.parse(stored) : [];

      if (!features.includes(feature)) {
        // Small delay to let the user see the result first
        setTimeout(() => {
          showFeatureFeedback(feature, featureLabel);
        }, 1000);
      }
    },
    [showFeatureFeedback]
  );

  const handleNPSDismiss = useCallback(() => {
    dismissNPS();
  }, [dismissNPS]);

  const handleFeatureFeedbackClose = useCallback(() => {
    setFeatureFeedback(null);
  }, []);

  const handleSessionFeedbackClose = useCallback(() => {
    setSessionFeedback(null);
  }, []);

  return (
    <ProactiveFeedbackContext.Provider
      value={{
        showNPSSurvey,
        showFeatureFeedback,
        checkAndShowSessionFeedback,
        triggerFeatureFeedbackCheck,
      }}
    >
      {children}

      {/* NPS Survey Modal */}
      <NPSSurvey
        open={npsOpen}
        onOpenChange={setNPSOpen}
        onDismiss={handleNPSDismiss}
      />

      {/* Feature Feedback Toast */}
      {featureFeedback && (
        <FeatureFeedbackToast
          feature={featureFeedback.feature}
          featureLabel={featureFeedback.label}
          show={featureFeedback.show}
          onClose={handleFeatureFeedbackClose}
        />
      )}

      {/* Session Feedback Modal */}
      {sessionFeedback && (
        <SessionFeedback
          open={sessionFeedback.open}
          onOpenChange={(open) => {
            if (!open) handleSessionFeedbackClose();
          }}
          flowType={sessionFeedback.flowType}
          flowLabel={sessionFeedback.label}
          onDismiss={handleSessionFeedbackClose}
        />
      )}
    </ProactiveFeedbackContext.Provider>
  );
}

export default ProactiveFeedbackProvider;
