import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/useScrollAnimation";

interface OnboardingStepProps {
  children: React.ReactNode;
  direction?: "forward" | "backward";
  className?: string;
}

export function OnboardingStep({
  children,
  direction = "forward",
  className,
}: OnboardingStepProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      className={cn(
        "w-full",
        !prefersReducedMotion && "animate-step-enter",
        !prefersReducedMotion &&
          direction === "backward" &&
          "animate-step-enter-back",
        className
      )}
    >
      {children}
      <style>{`
        @keyframes step-enter {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes step-enter-back {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-step-enter {
          animation: step-enter 0.3s ease-out forwards;
        }

        .animate-step-enter-back {
          animation: step-enter-back 0.3s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-step-enter,
          .animate-step-enter-back {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
