import { useState, useEffect } from "react";
import { Sparkles, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { GoalRefinement } from "@/stores/onboarding";
import { usePrefersReducedMotion } from "@/hooks/useScrollAnimation";

interface AICoachPanelProps {
  refinement: GoalRefinement;
  originalTitle: string;
  onApplyTitle: (title: string) => void;
  onCreateMilestones: (
    milestones: Array<{ title: string; description: string | null }>
  ) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function AICoachPanel({
  refinement,
  originalTitle,
  onApplyTitle,
  onCreateMilestones,
  onClose,
  isLoading = false,
}: AICoachPanelProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [expandedSections, setExpandedSections] = useState({
    smart: true,
    obstacles: false,
    milestones: true,
  });
  const [selectedMilestones, setSelectedMilestones] = useState<number[]>(
    refinement.milestones.map((_, i) => i)
  );
  const [appliedTitle, setAppliedTitle] = useState(false);
  const [displayedFeedback, setDisplayedFeedback] = useState("");

  // Typewriter effect for feedback
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedFeedback(refinement.overall_feedback);
      return;
    }

    let index = 0;
    const text = refinement.overall_feedback;
    setDisplayedFeedback("");

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedFeedback(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [refinement.overall_feedback, prefersReducedMotion]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleApplyTitle = (title: string) => {
    onApplyTitle(title);
    setAppliedTitle(true);
  };

  const toggleMilestone = (index: number) => {
    setSelectedMilestones((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index].sort()
    );
  };

  const handleCreateMilestones = () => {
    const milestonesToCreate = selectedMilestones.map(
      (i) => refinement.milestones[i]
    );
    onCreateMilestones(milestonesToCreate);
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-6">
        <div className="relative">
          <Sparkles className="h-12 w-12 animate-pulse text-purple-500" />
          <div className="absolute inset-0 animate-ping">
            <Sparkles className="h-12 w-12 text-purple-300 opacity-50" />
          </div>
        </div>
        <p className="text-center font-medium text-gray-700">
          AI Coach is analyzing your goal...
        </p>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-purple-100">
          <div className="animate-loading-bar h-full w-1/2 rounded-full bg-purple-500" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50",
        !prefersReducedMotion && "animate-slide-in-right"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-100 bg-white/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span className="font-semibold text-purple-700">AI Coach</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Overall feedback with typewriter */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-700">{displayedFeedback}</p>
        </div>

        {/* SMART Refinement */}
        {refinement.alternative_titles.length > 0 && (
          <div className="rounded-lg bg-white shadow-sm">
            <button
              onClick={() => toggleSection("smart")}
              className="flex w-full items-center justify-between p-4"
            >
              <span className="font-medium text-gray-900">
                SMART Refinement
              </span>
              {expandedSections.smart ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {expandedSections.smart && (
              <div className="space-y-3 border-t border-gray-100 p-4">
                <p className="text-sm text-gray-600">Suggested title:</p>
                <p className="rounded-md bg-purple-50 p-3 text-sm font-medium text-purple-900">
                  &ldquo;{refinement.alternative_titles[0]}&rdquo;
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleApplyTitle(refinement.alternative_titles[0])
                    }
                    disabled={appliedTitle}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {appliedTitle ? (
                      <>
                        <Check className="mr-1 h-3 w-3" /> Applied
                      </>
                    ) : (
                      "Apply"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyTitle(originalTitle)}
                  >
                    Keep Original
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Potential Obstacles */}
        {refinement.potential_obstacles.length > 0 && (
          <div className="rounded-lg bg-white shadow-sm">
            <button
              onClick={() => toggleSection("obstacles")}
              className="flex w-full items-center justify-between p-4"
            >
              <span className="font-medium text-gray-900">
                Potential Obstacles
              </span>
              {expandedSections.obstacles ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {expandedSections.obstacles && (
              <div className="space-y-2 border-t border-gray-100 p-4">
                {refinement.potential_obstacles.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-md bg-amber-50 p-3 text-sm"
                  >
                    <p className="font-medium text-amber-800">
                      • {item.obstacle}
                    </p>
                    <p className="mt-1 text-amber-700">→ {item.mitigation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quarterly Milestones */}
        {refinement.milestones.length > 0 && (
          <div className="rounded-lg bg-white shadow-sm">
            <button
              onClick={() => toggleSection("milestones")}
              className="flex w-full items-center justify-between p-4"
            >
              <span className="font-medium text-gray-900">
                Quarterly Milestones
              </span>
              {expandedSections.milestones ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {expandedSections.milestones && (
              <div className="space-y-3 border-t border-gray-100 p-4">
                {refinement.milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-md border border-gray-100 p-3"
                  >
                    <Checkbox
                      id={`milestone-${index}`}
                      checked={selectedMilestones.includes(index)}
                      onCheckedChange={() => toggleMilestone(index)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`milestone-${index}`}
                        className="cursor-pointer text-sm font-medium text-gray-900"
                      >
                        Q{index + 1}: {milestone.title}
                      </label>
                      {milestone.description && (
                        <p className="mt-1 text-xs text-gray-500">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  size="sm"
                  onClick={handleCreateMilestones}
                  disabled={selectedMilestones.length === 0}
                  className="mt-2 w-full bg-green-600 hover:bg-green-700"
                >
                  Create {selectedMilestones.length} quarterly goal
                  {selectedMilestones.length !== 1 ? "s" : ""}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-slide-in-right {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
