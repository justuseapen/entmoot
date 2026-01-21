import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TreeAnimation } from "../TreeAnimation";
import { OnboardingStep } from "../OnboardingStep";
import { OnboardingProgress } from "../OnboardingProgress";
import { AICoachPanel } from "../AICoachPanel";
import { useFamilyStore } from "@/stores/family";
import { useCreateGoal, useRefineGoal } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";
import type { GoalRefinement } from "@/stores/onboarding";

const INSPIRATION_CATEGORIES = [
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "health", label: "Health", emoji: "💪" },
  { id: "home", label: "Home", emoji: "🏠" },
  { id: "education", label: "Education", emoji: "📚" },
  { id: "finances", label: "Finances", emoji: "💰" },
] as const;

const INSPIRATION_IDEAS: Record<string, string[]> = {
  travel: [
    "Take a dream vacation to Japan",
    "Visit all 50 states as a family",
    "Go on a European adventure",
  ],
  health: [
    "Run a 5K together as a family",
    "Cook healthy dinners at home 5 nights a week",
    "Start a family exercise routine",
  ],
  home: [
    "Renovate the backyard for family gatherings",
    "Create a dedicated family game room",
    "Declutter and organize every room",
  ],
  education: [
    "Help kids get straight A's this year",
    "Learn a new language together",
    "Read 50 books as a family",
  ],
  finances: [
    "Save $10,000 for a family emergency fund",
    "Pay off all credit card debt",
    "Start a college fund for each child",
  ],
};

interface BigGoalStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function BigGoalStep({ onNext, onBack, onSkip }: BigGoalStepProps) {
  const currentFamily = useFamilyStore((state) => state.currentFamily);
  const familyId = currentFamily?.id;

  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [refinement, setRefinement] = useState<GoalRefinement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdGoalId, setCreatedGoalId] = useState<number | null>(null);

  const createGoalMutation = useCreateGoal(familyId || 0);
  const refineGoalMutation = useRefineGoal(familyId || 0, createdGoalId || 0);

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const handleInspirationClick = (idea: string) => {
    setGoalTitle(idea);
    setSelectedCategory(null);
  };

  const handleGetAICoaching = async () => {
    if (!familyId || !goalTitle.trim()) return;

    setError(null);

    try {
      // First create the goal
      const result = await createGoalMutation.mutateAsync({
        title: goalTitle,
        description: goalDescription || undefined,
        time_scale: "annual",
        visibility: "family",
        status: "not_started",
      });

      setCreatedGoalId(result.goal.id);

      // Then get AI refinement
      const refinementResult = await refineGoalMutation.mutateAsync();
      setRefinement(refinementResult.refinement as GoalRefinement);
      setShowAIPanel(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create goal or get AI coaching"
      );
    }
  };

  const handleApplyTitle = (title: string) => {
    setGoalTitle(title);
    // We could update the goal here, but for onboarding we'll just keep the title in state
  };

  const handleCreateMilestones = async (
    milestones: Array<{ title: string; description: string | null }>
  ) => {
    if (!familyId || !createdGoalId) return;

    // Create quarterly goals as children of the annual goal
    for (const milestone of milestones) {
      await createGoalMutation.mutateAsync({
        title: milestone.title,
        description: milestone.description || undefined,
        time_scale: "quarterly",
        visibility: "family",
        status: "not_started",
        parent_id: createdGoalId,
      });
    }

    // Move to next step after creating milestones
    onNext();
  };

  const handleContinueWithoutAI = async () => {
    if (!familyId || !goalTitle.trim()) {
      onNext();
      return;
    }

    setError(null);

    try {
      // Create the goal without AI coaching
      await createGoalMutation.mutateAsync({
        title: goalTitle,
        description: goalDescription || undefined,
        time_scale: "annual",
        visibility: "family",
        status: "not_started",
      });

      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal");
    }
  };

  const isLoading =
    createGoalMutation.isPending || refineGoalMutation.isPending;

  return (
    <OnboardingStep>
      <div className="flex h-full">
        {/* Main content */}
        <div
          className={cn(
            "flex flex-col px-4 py-6 transition-all duration-300",
            showAIPanel ? "w-1/2" : "mx-auto w-full max-w-lg"
          )}
        >
          {/* Progress bar */}
          <OnboardingProgress currentStep="big_goal" className="mb-8" />

          <div className="flex flex-col items-center">
            {/* Tree animation - stage 3 */}
            <div className="mb-6 h-28 w-28">
              <TreeAnimation stage={3} />
            </div>

            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
              What&apos;s your family&apos;s BIG dream for this year?
            </h1>

            <p className="mb-6 text-center text-gray-600">
              Think big. Dream together. This is the goal that everything else
              connects to.
            </p>

            {error && (
              <div className="mb-4 w-full rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Goal input */}
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goalTitle">Your BIG Goal</Label>
                <Input
                  id="goalTitle"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Take a dream vacation to Japan"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goalDescription" className="text-gray-600">
                  Description (optional)
                </Label>
                <Textarea
                  id="goalDescription"
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Add more details about your goal..."
                  rows={2}
                />
              </div>
            </div>

            {/* Inspiration categories */}
            <div className="mt-6 w-full">
              <p className="mb-3 text-sm text-gray-500">Need inspiration?</p>
              <div className="flex flex-wrap gap-2">
                {INSPIRATION_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-all",
                      selectedCategory === category.id
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {category.emoji} {category.label}
                  </button>
                ))}
              </div>

              {/* Inspiration ideas */}
              {selectedCategory && (
                <div className="mt-3 space-y-2">
                  {INSPIRATION_IDEAS[selectedCategory].map((idea, index) => (
                    <button
                      key={index}
                      onClick={() => handleInspirationClick(idea)}
                      className="block w-full rounded-md border border-gray-200 bg-white p-2 text-left text-sm text-gray-700 transition-all hover:border-green-300 hover:bg-green-50"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-8 w-full space-y-3">
              <Button
                onClick={handleGetAICoaching}
                disabled={!goalTitle.trim() || isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  "Working..."
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get AI Coaching →
                  </>
                )}
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex-1"
                >
                  ← Back
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goalTitle.trim() ? handleContinueWithoutAI : onSkip}
                  className="flex-1"
                >
                  {goalTitle.trim() ? "Continue without AI" : "Skip for now"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Coach Panel (slides in from right) */}
        {showAIPanel && (
          <div className="w-1/2 border-l border-gray-200">
            <AICoachPanel
              refinement={refinement!}
              originalTitle={goalTitle}
              onApplyTitle={handleApplyTitle}
              onCreateMilestones={handleCreateMilestones}
              onClose={() => {
                setShowAIPanel(false);
                onNext();
              }}
              isLoading={refineGoalMutation.isPending}
            />
          </div>
        )}
      </div>
    </OnboardingStep>
  );
}
