import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingStore, ONBOARDING_STEPS } from "@/stores/onboarding";
import {
  useOnboardingStatus,
  useUpdateOnboardingStep,
  useSkipOnboardingStep,
  useAutoCompleteOnboarding,
} from "@/hooks/useOnboarding";
import { useAuthStore } from "@/stores/auth";
import { SeedTransition } from "./TreeAnimation";
import { WelcomeStep } from "./steps/WelcomeStep";
import { FamilyBasicsStep } from "./steps/FamilyBasicsStep";
import { BigGoalStep } from "./steps/BigGoalStep";
import { CalendarConnectStep } from "./steps/CalendarConnectStep";
import { InviteFamilyStep } from "./steps/InviteFamilyStep";
import { CompleteStep } from "./steps/CompleteStep";

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const {
    currentStep,
    setCurrentStep,
    showTransition,
    transitionType,
    setShowTransition,
  } = useOnboardingStore();

  const { data: status, isLoading: isStatusLoading, isError, error } = useOnboardingStatus();
  const updateStepMutation = useUpdateOnboardingStep();
  const skipStepMutation = useSkipOnboardingStep();
  const autoCompleteMutation = useAutoCompleteOnboarding();

  // Trigger transition for new users (only once when data loads)
  // The Zustand store tracks showTransition state, so we only call setShowTransition
  // (an external state update) which is acceptable in effects
  useEffect(() => {
    // Only trigger once when we have user data and status loaded
    if (
      !showTransition &&
      user &&
      !user.onboarding_wizard_completed_at &&
      status !== undefined &&
      !status?.current_step
    ) {
      setShowTransition(true, "seed");
    }
  }, [user, status, showTransition, setShowTransition]);

  // Handle transition completion - memoized to prevent unnecessary re-renders
  const handleTransitionComplete = useCallback(() => {
    setShowTransition(false);
  }, [setShowTransition]);

  // Auto-complete for existing users who already have families and goals
  useEffect(() => {
    if (
      status &&
      !status.completed &&
      status.has_family &&
      status.has_goal &&
      !autoCompleteMutation.isPending
    ) {
      autoCompleteMutation.mutate(undefined, {
        onSuccess: (data) => {
          if (user) {
            setUser({
              ...user,
              onboarding_required: false,
              onboarding_wizard_completed_at: data.completed_at,
            });
          }
          navigate("/dashboard", { replace: true });
        },
      });
    }
  }, [status, autoCompleteMutation, navigate, user, setUser]);

  // If already completed, redirect to dashboard
  useEffect(() => {
    if (status?.completed) {
      navigate("/dashboard", { replace: true });
    }
  }, [status?.completed, navigate]);

  // Sync step from server
  useEffect(() => {
    if (status && !status.completed) {
      const stepIndex = status.current_step;
      if (stepIndex > 0 && stepIndex <= ONBOARDING_STEPS.length) {
        const step = ONBOARDING_STEPS[stepIndex - 1];
        setCurrentStep(step);
      }
    }
  }, [status, setCurrentStep]);

  const goToNextStep = () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      const nextStep = ONBOARDING_STEPS[currentIndex + 1];
      setCurrentStep(nextStep);
    }
  };

  const goToPrevStep = () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = ONBOARDING_STEPS[currentIndex - 1];
      setCurrentStep(prevStep);
    }
  };

  const handleWelcomeNext = async (challenge: string) => {
    try {
      await updateStepMutation.mutateAsync({
        stepName: "welcome",
        data: { challenge },
      });
      goToNextStep();
    } catch {
      // Error handled by mutation
    }
  };

  const handleFamilyBasicsNext = async () => {
    try {
      await updateStepMutation.mutateAsync({
        stepName: "family_basics",
      });
      goToNextStep();
    } catch {
      // Error handled by mutation
    }
  };

  const handleBigGoalNext = async () => {
    try {
      await updateStepMutation.mutateAsync({
        stepName: "big_goal",
      });
      goToNextStep();
    } catch {
      // Error handled by mutation
    }
  };

  const handleBigGoalSkip = async () => {
    try {
      await skipStepMutation.mutateAsync("big_goal");
      goToNextStep();
    } catch {
      // Error handled by mutation
    }
  };

  const handleCalendarNext = async () => {
    try {
      await updateStepMutation.mutateAsync({
        stepName: "calendar",
      });
      goToNextStep();
    } catch {
      // Error handled by mutation
    }
  };

  const handleCalendarSkip = async () => {
    try {
      await skipStepMutation.mutateAsync("calendar");
      goToNextStep();
    } catch {
      // Error handled by mutation
    }
  };

  const handleInviteNext = async () => {
    try {
      await updateStepMutation.mutateAsync({
        stepName: "invite",
      });
      goToNextStep();
    } catch {
      // Error handled by mutation
    }
  };

  const handleInviteSkip = async () => {
    try {
      await skipStepMutation.mutateAsync("invite");
      goToNextStep();
    } catch {
      // Error handled by mutation
    }
  };

  const handleComplete = async () => {
    try {
      const result = await updateStepMutation.mutateAsync({
        stepName: "complete",
      });
      if (user) {
        setUser({
          ...user,
          onboarding_required: false,
          onboarding_wizard_completed_at:
            result.completed_at || new Date().toISOString(),
        });
      }
      navigate("/dashboard", { replace: true });
    } catch {
      // Error handled by mutation
    }
  };

  // Show seed transition for new users
  if (showTransition && transitionType === "seed") {
    return <SeedTransition onComplete={handleTransitionComplete} />;
  }

  // Loading state
  if (isStatusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-green-100" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <span className="text-xl">⚠️</span>
          </div>
          <p className="text-gray-900 font-medium">Failed to load onboarding</p>
          <p className="text-gray-600 text-sm mt-1">
            {error instanceof Error ? error.message : "Please try again"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onNext={handleWelcomeNext} />;
      case "family_basics":
        return (
          <FamilyBasicsStep
            onNext={handleFamilyBasicsNext}
            onBack={goToPrevStep}
          />
        );
      case "big_goal":
        return (
          <BigGoalStep
            onNext={handleBigGoalNext}
            onBack={goToPrevStep}
            onSkip={handleBigGoalSkip}
          />
        );
      case "calendar":
        return (
          <CalendarConnectStep
            onNext={handleCalendarNext}
            onBack={goToPrevStep}
            onSkip={handleCalendarSkip}
          />
        );
      case "invite":
        return (
          <InviteFamilyStep
            onNext={handleInviteNext}
            onBack={goToPrevStep}
            onSkip={handleInviteSkip}
          />
        );
      case "complete":
        return <CompleteStep onComplete={handleComplete} />;
      default:
        return <WelcomeStep onNext={handleWelcomeNext} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {renderStep()}
    </div>
  );
}
