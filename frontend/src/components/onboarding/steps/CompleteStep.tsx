import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Clipboard, Target, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TreeAnimation } from "../TreeAnimation";
import { OnboardingStep } from "../OnboardingStep";
import { useAuthStore } from "@/stores/auth";
import { useFamilyStore } from "@/stores/family";
import { usePrefersReducedMotion } from "@/hooks/useScrollAnimation";
import confetti from "canvas-confetti";

interface CompleteStepProps {
  onComplete: () => void;
}

export function CompleteStep({ onComplete }: CompleteStepProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentFamily = useFamilyStore((state) => state.currentFamily);
  const prefersReducedMotion = usePrefersReducedMotion();
  const hasPlayedConfetti = useRef(false);

  const firstName = user?.name?.split(" ")[0] || "there";
  const familyId = currentFamily?.id;

  // Fire confetti on mount
  useEffect(() => {
    if (hasPlayedConfetti.current || prefersReducedMotion) return;

    hasPlayedConfetti.current = true;

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#22c55e", "#4ade80", "#86efac", "#fcd34d", "#fbbf24"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#22c55e", "#4ade80", "#86efac", "#fcd34d", "#fbbf24"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const handleNavigate = (path: string) => {
    onComplete();
    navigate(path);
  };

  return (
    <OnboardingStep>
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-8">
        {/* Tree animation - stage 6 (full tree) */}
        <div className="mb-6 h-40 w-40">
          <TreeAnimation stage={6} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-bold text-gray-900">
          You did it, {firstName}!
        </h1>

        <p className="mb-8 text-center text-gray-600">
          Your family hub is ready. Here&apos;s what you can do next:
        </p>

        {/* Action cards */}
        <div className="w-full space-y-4">
          {/* Daily planning */}
          <button
            onClick={() =>
              handleNavigate(
                familyId ? `/families/${familyId}/planner` : "/dashboard"
              )
            }
            className="group flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-green-300 hover:bg-green-50 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 transition-colors group-hover:bg-green-200">
              <Clipboard className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Start Your Day</h3>
              <p className="text-sm text-gray-500">
                Set your top 3 priorities for today
              </p>
            </div>
            <div className="text-green-600 opacity-0 transition-opacity group-hover:opacity-100">
              →
            </div>
          </button>

          {/* Goal tree */}
          <button
            onClick={() =>
              handleNavigate(
                familyId ? `/families/${familyId}/goals/tree` : "/dashboard"
              )
            }
            className="group flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-purple-300 hover:bg-purple-50 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-200">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                Break Down Your BIG Goal
              </h3>
              <p className="text-sm text-gray-500">
                Create quarterly milestones
              </p>
            </div>
            <div className="text-purple-600 opacity-0 transition-opacity group-hover:opacity-100">
              →
            </div>
          </button>

          {/* Dashboard */}
          <button
            onClick={() => handleNavigate("/dashboard")}
            className="group flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-200">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                Explore Your Dashboard
              </h3>
              <p className="text-sm text-gray-500">
                See everything at a glance
              </p>
            </div>
            <div className="text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
              →
            </div>
          </button>
        </div>

        {/* Optional tour */}
        <Button
          variant="ghost"
          onClick={() => handleNavigate("/dashboard")}
          className="mt-8 text-gray-500"
        >
          Take a Quick Tour
        </Button>
      </div>
    </OnboardingStep>
  );
}
