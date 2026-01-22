import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TreeAnimation } from "../TreeAnimation";
import { OnboardingStep } from "../OnboardingStep";
import { useAuthStore } from "@/stores/auth";

const CHALLENGES = [
  { value: "sync", label: "Everyone's too busy - hard to sync" },
  { value: "followthrough", label: "Kids don't follow through on tasks" },
  { value: "goals", label: "We set goals but never achieve them" },
  { value: "solo", label: "I'm doing all the planning alone" },
  { value: "vision", label: "We lack a shared vision" },
] as const;

interface WelcomeStepProps {
  onNext: (challenge: string) => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { user } = useAuthStore();
  const [selectedChallenge, setSelectedChallenge] = useState<string>("");
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <OnboardingStep>
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-8">
        {/* Tree logo */}
        <div className="mb-6 h-32 w-32">
          <TreeAnimation stage={1} />
        </div>

        {/* Welcome heading */}
        <h1 className="mb-3 text-center text-3xl font-bold text-gray-900">
          Welcome to Entmoot, {firstName}!
        </h1>

        <p className="mb-8 text-center text-gray-600">
          You&apos;re about to transform how your family plans and achieves
          together.
        </p>

        {/* Challenge selection */}
        <div className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <Label className="mb-4 block text-base font-medium text-gray-900">
            What&apos;s your biggest challenge with family planning?
          </Label>

          <RadioGroup
            value={selectedChallenge}
            onValueChange={setSelectedChallenge}
            className="space-y-3"
          >
            {CHALLENGES.map((challenge) => (
              <div
                key={challenge.value}
                className="flex items-center space-x-3"
              >
                <RadioGroupItem
                  value={challenge.value}
                  id={challenge.value}
                  className="border-gray-300"
                />
                <Label
                  htmlFor={challenge.value}
                  className="cursor-pointer text-sm font-normal text-gray-700"
                >
                  {challenge.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Time estimate */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Takes about 3 minutes • Skip optional parts anytime
        </p>

        {/* Continue button */}
        <Button
          onClick={() => onNext(selectedChallenge)}
          disabled={!selectedChallenge}
          className="mt-6 w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          Continue →
        </Button>
      </div>
    </OnboardingStep>
  );
}
