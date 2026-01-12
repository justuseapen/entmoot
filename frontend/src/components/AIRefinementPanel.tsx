import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  type GoalRefinementResponse,
  type SmartSuggestions,
  smartFieldLabels,
  smartFieldDescriptions,
} from "@/lib/goals";

interface MilestoneSubGoal {
  title: string;
  description: string | null;
  suggestedProgress: number;
}

interface AIRefinementPanelProps {
  refinement: GoalRefinementResponse;
  currentValues: {
    title: string;
    description: string;
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    time_bound: string;
  };
  onAcceptSmartSuggestion: (
    field: keyof SmartSuggestions,
    value: string
  ) => void;
  onAcceptTitle: (title: string) => void;
  onAcceptDescription: (description: string) => void;
  onDismiss: () => void;
  onCreateSubGoal?: (milestone: MilestoneSubGoal) => void;
}

export function AIRefinementPanel({
  refinement,
  currentValues,
  onAcceptSmartSuggestion,
  onAcceptTitle,
  onAcceptDescription,
  onDismiss,
  onCreateSubGoal,
}: AIRefinementPanelProps) {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(
    new Set()
  );
  const [createdMilestones, setCreatedMilestones] = useState<Set<number>>(
    new Set()
  );

  const handleDismissSuggestion = (key: string) => {
    setDismissedSuggestions((prev) => new Set([...prev, key]));
  };

  const handleCreateSubGoal = (
    milestone: {
      title: string;
      description: string | null;
      suggested_progress: number;
    },
    index: number
  ) => {
    if (onCreateSubGoal) {
      onCreateSubGoal({
        title: milestone.title,
        description: milestone.description,
        suggestedProgress: milestone.suggested_progress,
      });
      setCreatedMilestones((prev) => new Set([...prev, index]));
    }
  };

  const hasAnySuggestions =
    Object.values(refinement.smart_suggestions).some((v) => v) ||
    refinement.alternative_titles.length > 0 ||
    refinement.alternative_descriptions.length > 0 ||
    refinement.potential_obstacles.length > 0 ||
    refinement.milestones.length > 0;

  if (!hasAnySuggestions) {
    return (
      <Card className="border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <h4 className="font-medium text-green-800">
              Your goal looks great!
            </h4>
            <p className="mt-1 text-sm text-green-700">
              {refinement.overall_feedback}
            </p>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={onDismiss}>
            Close
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Feedback */}
      <Card className="border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <h4 className="font-medium text-blue-800">AI Coach Suggestions</h4>
            <p className="mt-1 text-sm text-blue-700">
              {refinement.overall_feedback}
            </p>
          </div>
        </div>
      </Card>

      {/* Alternative Titles */}
      {refinement.alternative_titles.length > 0 &&
        !dismissedSuggestions.has("titles") && (
          <SuggestionSection
            title="Alternative Titles"
            icon="📝"
            onDismiss={() => handleDismissSuggestion("titles")}
          >
            <div className="space-y-2">
              {refinement.alternative_titles.map((title, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-md bg-white p-2"
                >
                  <span className="text-sm">{title}</span>
                  {title !== currentValues.title && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAcceptTitle(title)}
                    >
                      Use this
                    </Button>
                  )}
                  {title === currentValues.title && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </SuggestionSection>
        )}

      {/* Alternative Descriptions */}
      {refinement.alternative_descriptions.length > 0 &&
        !dismissedSuggestions.has("descriptions") && (
          <SuggestionSection
            title="Alternative Descriptions"
            icon="📋"
            onDismiss={() => handleDismissSuggestion("descriptions")}
          >
            <div className="space-y-2">
              {refinement.alternative_descriptions.map((desc, index) => (
                <div key={index} className="rounded-md bg-white p-2">
                  <p className="text-sm">{desc}</p>
                  <div className="mt-2 flex justify-end">
                    {desc !== currentValues.description && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAcceptDescription(desc)}
                      >
                        Use this
                      </Button>
                    )}
                    {desc === currentValues.description && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SuggestionSection>
        )}

      {/* SMART Field Suggestions */}
      {Object.entries(refinement.smart_suggestions).map(([field, value]) => {
        if (!value || dismissedSuggestions.has(`smart-${field}`)) return null;
        const fieldKey = field as keyof SmartSuggestions;
        const currentValue = currentValues[fieldKey];

        return (
          <SuggestionSection
            key={field}
            title={smartFieldLabels[fieldKey]}
            subtitle={smartFieldDescriptions[fieldKey]}
            icon="💡"
            onDismiss={() => handleDismissSuggestion(`smart-${field}`)}
          >
            <div className="rounded-md bg-white p-3">
              <p className="text-sm">{value}</p>
              <div className="mt-2 flex justify-end gap-2">
                {value !== currentValue && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAcceptSmartSuggestion(fieldKey, value)}
                  >
                    Apply suggestion
                  </Button>
                )}
                {value === currentValue && (
                  <Badge variant="secondary">Already applied</Badge>
                )}
              </div>
            </div>
          </SuggestionSection>
        );
      })}

      {/* Potential Obstacles */}
      {refinement.potential_obstacles.length > 0 &&
        !dismissedSuggestions.has("obstacles") && (
          <SuggestionSection
            title="Potential Obstacles"
            icon="⚠️"
            onDismiss={() => handleDismissSuggestion("obstacles")}
          >
            <div className="space-y-3">
              {refinement.potential_obstacles.map((obs, index) => (
                <div key={index} className="rounded-md bg-white p-3">
                  <div className="font-medium text-amber-800">
                    {obs.obstacle}
                  </div>
                  {obs.mitigation && (
                    <div className="mt-1 text-sm text-gray-600">
                      <span className="font-medium">Suggestion:</span>{" "}
                      {obs.mitigation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SuggestionSection>
        )}

      {/* Milestones */}
      {refinement.milestones.length > 0 &&
        !dismissedSuggestions.has("milestones") && (
          <SuggestionSection
            title="Suggested Milestones"
            subtitle="Break your goal into smaller steps"
            icon="🎯"
            onDismiss={() => handleDismissSuggestion("milestones")}
          >
            <div className="space-y-2">
              {refinement.milestones.map((milestone, index) => (
                <div key={index} className="rounded-md bg-white p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-700">
                      {milestone.suggested_progress}%
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{milestone.title}</div>
                      {milestone.description && (
                        <div className="text-sm text-gray-500">
                          {milestone.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {onCreateSubGoal && (
                    <div className="mt-2 flex justify-end">
                      {createdMilestones.has(index) ? (
                        <Badge variant="secondary">Sub-goal created</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateSubGoal(milestone, index)}
                        >
                          Create as sub-goal
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {!onCreateSubGoal && (
                <p className="text-muted-foreground text-xs">
                  Consider creating these as sub-goals linked to this goal.
                </p>
              )}
            </div>
          </SuggestionSection>
        )}

      <Separator />

      {/* Dismiss All */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onDismiss}>
          Close AI Suggestions
        </Button>
      </div>
    </div>
  );
}

// Helper component for suggestion sections
interface SuggestionSectionProps {
  title: string;
  subtitle?: string;
  icon: string;
  onDismiss: () => void;
  children: React.ReactNode;
}

function SuggestionSection({
  title,
  subtitle,
  icon,
  onDismiss,
  children,
}: SuggestionSectionProps) {
  return (
    <Card className="border-purple-200 bg-purple-50 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <h4 className="font-medium text-purple-800">{title}</h4>
            {subtitle && <p className="text-xs text-purple-600">{subtitle}</p>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-purple-500 hover:text-purple-700"
          onClick={onDismiss}
          title="Dismiss"
        >
          ×
        </Button>
      </div>
      {children}
    </Card>
  );
}
