import { cn } from "@/lib/utils";
import {
  ONBOARDING_STEPS,
  STEP_INFO,
  type OnboardingStep,
} from "@/stores/onboarding";

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
  skippedSteps?: string[];
  className?: string;
}

export function OnboardingProgress({
  currentStep,
  skippedSteps = [],
  className,
}: OnboardingProgressProps) {
  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
  // Total steps excluding 'complete' for progress display
  const displaySteps = ONBOARDING_STEPS.filter((s) => s !== "complete");
  const totalSteps = displaySteps.length;
  const progressPercentage = Math.round(
    ((currentIndex + 1) / totalSteps) * 100
  );

  // Don't show progress on welcome or complete screens
  if (currentStep === "welcome" || currentStep === "complete") {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Step {STEP_INFO[currentStep].index} of {totalSteps}
        </span>
        <span className="font-medium text-green-600">
          {progressPercentage}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      {/* Step indicators */}
      <div className="mt-3 flex justify-between">
        {displaySteps.map((step, index) => {
          const stepInfo = STEP_INFO[step];
          const isCompleted = index < currentIndex;
          const isCurrent = step === currentStep;
          const isSkipped = skippedSteps.includes(step);

          return (
            <div
              key={step}
              className="flex flex-col items-center"
              title={stepInfo.label}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
                  {
                    "bg-green-500 text-white": isCompleted && !isSkipped,
                    "bg-green-500 text-white ring-4 ring-green-200": isCurrent,
                    "bg-gray-200 text-gray-500":
                      !isCompleted && !isCurrent && !isSkipped,
                    "bg-gray-300 text-gray-500": isSkipped,
                  }
                )}
              >
                {isCompleted && !isSkipped ? (
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : isSkipped ? (
                  <span className="text-[10px]">−</span>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "mt-1 hidden text-[10px] sm:block",
                  isCurrent
                    ? "font-medium text-green-600"
                    : "text-muted-foreground"
                )}
              >
                {stepInfo.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
