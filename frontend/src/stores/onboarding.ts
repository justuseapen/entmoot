import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingStep =
  | "welcome"
  | "family_basics"
  | "big_goal"
  | "calendar"
  | "invite"
  | "complete";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "welcome",
  "family_basics",
  "big_goal",
  "calendar",
  "invite",
  "complete",
];

export const STEP_INFO: Record<
  OnboardingStep,
  { index: number; label: string; required: boolean }
> = {
  welcome: { index: 1, label: "Welcome", required: true },
  family_basics: { index: 2, label: "Family Basics", required: true },
  big_goal: { index: 3, label: "BIG Goal", required: false },
  calendar: { index: 4, label: "Calendar", required: false },
  invite: { index: 5, label: "Invite Family", required: false },
  complete: { index: 6, label: "Complete", required: false },
};

export interface OnboardingStatus {
  completed: boolean;
  completed_at: string | null;
  current_step: number;
  skipped_steps: string[];
  challenge: string | null;
  calendar_waitlist: Record<string, string>;
  has_family: boolean;
  has_goal: boolean;
}

interface OnboardingState {
  // Server state
  status: OnboardingStatus | null;
  isLoading: boolean;
  error: string | null;

  // Local state
  currentStep: OnboardingStep;
  showTransition: boolean;
  transitionType: "seed" | "growth" | null;

  // Goal data (for passing between steps)
  goalData: {
    title: string;
    description?: string;
    refinement?: GoalRefinement | null;
  } | null;

  // Actions
  setStatus: (status: OnboardingStatus) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setShowTransition: (show: boolean, type?: "seed" | "growth") => void;
  setGoalData: (data: OnboardingState["goalData"]) => void;
  reset: () => void;
}

export interface GoalRefinement {
  smart_suggestions: {
    specific: string | null;
    measurable: string | null;
    achievable: string | null;
    relevant: string | null;
    time_bound: string | null;
  };
  alternative_titles: string[];
  alternative_descriptions: string[];
  potential_obstacles: Array<{ obstacle: string; mitigation: string }>;
  milestones: Array<{
    title: string;
    description: string | null;
    suggested_progress: number;
  }>;
  overall_feedback: string;
}

const initialState = {
  status: null,
  isLoading: false,
  error: null,
  currentStep: "welcome" as OnboardingStep,
  showTransition: false,
  transitionType: null as "seed" | "growth" | null,
  goalData: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStatus: (status) => {
        const stepIndex = status.current_step;
        const currentStep =
          stepIndex > 0 && stepIndex <= ONBOARDING_STEPS.length
            ? ONBOARDING_STEPS[stepIndex - 1]
            : "welcome";
        set({ status, currentStep });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep } = get();
        const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
        if (currentIndex < ONBOARDING_STEPS.length - 1) {
          set({ currentStep: ONBOARDING_STEPS[currentIndex + 1] });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
        if (currentIndex > 0) {
          set({ currentStep: ONBOARDING_STEPS[currentIndex - 1] });
        }
      },

      setShowTransition: (show, type) =>
        set({ showTransition: show, transitionType: type ?? null }),

      setGoalData: (data) => set({ goalData: data }),

      reset: () => set(initialState),
    }),
    {
      name: "entmoot-onboarding",
      partialize: (state) => ({
        currentStep: state.currentStep,
        goalData: state.goalData,
      }),
    }
  )
);
