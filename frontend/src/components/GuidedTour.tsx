import { useState, useEffect, useCallback } from "react";
import Joyride, { STATUS, ACTIONS, EVENTS } from "react-joyride";
import type { CallBackProps } from "react-joyride";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useTourPreferences,
  useCompleteTour,
  useDismissTour,
} from "@/hooks/useTour";
import { TOUR_STEPS } from "@/lib/tour";

interface GuidedTourProps {
  onTourStart?: () => void;
  onTourEnd?: () => void;
}

export function GuidedTour({ onTourStart, onTourEnd }: GuidedTourProps) {
  const { data: tourPrefs, isLoading } = useTourPreferences();
  const completeTour = useCompleteTour();
  const dismissTour = useDismissTour();

  const [showPrompt, setShowPrompt] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  // Show prompt when tour should be shown
  useEffect(() => {
    const shouldShowTour =
      !isLoading &&
      tourPrefs?.tour_preferences?.should_show_tour &&
      !hasShownPrompt;

    if (shouldShowTour) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setShowPrompt(true);
        setHasShownPrompt(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, tourPrefs, hasShownPrompt]);

  // Handle starting the tour
  const handleStartTour = () => {
    setShowPrompt(false);
    setRunTour(true);
    onTourStart?.();
  };

  // Handle dismissing the tour (show me later)
  const handleShowLater = async () => {
    setShowPrompt(false);
    await dismissTour.mutateAsync();
  };

  // Handle skipping the tour permanently
  const handleSkipTour = async () => {
    setShowPrompt(false);
    await completeTour.mutateAsync();
  };

  // Handle joyride callback
  const handleJoyrideCallback = useCallback(
    async (data: CallBackProps) => {
      const { status, action, type } = data;

      // Tour finished or skipped
      if (
        status === STATUS.FINISHED ||
        status === STATUS.SKIPPED ||
        (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER)
      ) {
        setRunTour(false);
        await completeTour.mutateAsync();
        onTourEnd?.();
      }
    },
    [completeTour, onTourEnd]
  );

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* Tour Prompt Dialog */}
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to Entmoot! 🌳</DialogTitle>
            <DialogDescription>
              Would you like a quick tour of the app? It takes about 2 minutes
              and will help you get started.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleShowLater}
              disabled={dismissTour.isPending}
            >
              Show me later
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkipTour}
              disabled={completeTour.isPending}
            >
              Skip
            </Button>
            <Button onClick={handleStartTour}>Start Tour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Joyride Tour */}
      <Joyride
        steps={TOUR_STEPS}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "#2563eb", // Blue-600
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 8,
          },
          buttonNext: {
            borderRadius: 6,
          },
          buttonBack: {
            borderRadius: 6,
          },
          buttonSkip: {
            borderRadius: 6,
          },
        }}
        locale={{
          back: "Back",
          close: "Close",
          last: "Finish",
          next: "Next",
          skip: "Skip Tour",
        }}
      />
    </>
  );
}
