import { useState } from "react";
import { ChevronRight, ChevronDown, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { type Goal, getTimeScaleLabel, getStatusLabel } from "@/lib/goals";

interface GoalTreeNodeProps {
  goal: Goal;
  childGoals: Goal[];
  allGoals: Goal[];
  level: number;
  onGoalClick: (goal: Goal) => void;
}

// Color coding by time scale
function getTimeScaleColor(timeScale: string): {
  bg: string;
  border: string;
  text: string;
  connector: string;
} {
  switch (timeScale) {
    case "annual":
      return {
        bg: "bg-red-50",
        border: "border-red-300",
        text: "text-red-700",
        connector: "bg-red-300",
      };
    case "quarterly":
      return {
        bg: "bg-yellow-50",
        border: "border-yellow-300",
        text: "text-yellow-700",
        connector: "bg-yellow-300",
      };
    case "monthly":
      return {
        bg: "bg-green-50",
        border: "border-green-300",
        text: "text-green-700",
        connector: "bg-green-300",
      };
    case "weekly":
      return {
        bg: "bg-blue-50",
        border: "border-blue-300",
        text: "text-blue-700",
        connector: "bg-blue-300",
      };
    case "daily":
      return {
        bg: "bg-purple-50",
        border: "border-purple-300",
        text: "text-purple-700",
        connector: "bg-purple-300",
      };
    default:
      return {
        bg: "bg-gray-50",
        border: "border-gray-300",
        text: "text-gray-700",
        connector: "bg-gray-300",
      };
  }
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "in_progress":
      return "secondary";
    case "at_risk":
    case "abandoned":
      return "destructive";
    default:
      return "outline";
  }
}

export function GoalTreeNode({
  goal,
  childGoals,
  allGoals,
  level,
  onGoalClick,
}: GoalTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const hasChildren = childGoals.length > 0;
  const colors = getTimeScaleColor(goal.time_scale);

  // Find children of each child goal for recursive rendering
  const getChildGoals = (parentId: number) =>
    allGoals.filter((g) => g.parent_id === parentId);

  return (
    <div className="relative">
      {/* Horizontal connector from parent */}
      {level > 0 && (
        <div
          className={cn(
            "absolute top-6 -left-6 h-0.5 w-6",
            getTimeScaleColor(goal.time_scale).connector
          )}
        />
      )}

      {/* Goal node */}
      <div
        className={cn(
          "relative rounded-lg border-2 p-3 transition-shadow hover:shadow-md",
          colors.bg,
          colors.border
        )}
      >
        <div className="flex items-start gap-2">
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && (
            <Target className={cn("mt-0.5 h-4 w-4 shrink-0", colors.text)} />
          )}

          {/* Goal content */}
          <div
            className="min-w-0 flex-1 cursor-pointer"
            onClick={() => onGoalClick(goal)}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="leading-tight font-medium">{goal.title}</h3>
              <div className="flex shrink-0 gap-1">
                <Badge
                  variant="outline"
                  className={cn("text-xs", colors.text, colors.border)}
                >
                  {getTimeScaleLabel(goal.time_scale)}
                </Badge>
              </div>
            </div>

            {goal.description && (
              <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
                {goal.description}
              </p>
            )}

            {/* Progress and status row */}
            <div className="mt-2 flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2">
                <Progress value={goal.progress} className="h-1.5 flex-1" />
                <span className="text-muted-foreground shrink-0 text-xs">
                  {goal.progress}%
                </span>
              </div>
              <Badge
                variant={getStatusBadgeVariant(goal.status)}
                className="text-xs"
              >
                {getStatusLabel(goal.status)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative mt-2 ml-6">
          {/* Vertical connector line */}
          <div
            className={cn(
              "absolute top-0 left-0 w-0.5",
              colors.connector,
              // Calculate height based on number of children
              childGoals.length === 1 ? "h-6" : "h-full"
            )}
            style={{
              height: childGoals.length > 1 ? `calc(100% - 1rem)` : undefined,
            }}
          />

          <div className="space-y-2 pl-6">
            {childGoals.map((childGoal, index) => (
              <div key={childGoal.id} className="relative">
                {/* Extra connector for non-last items */}
                {index < childGoals.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-6 -left-6 w-0.5",
                      colors.connector
                    )}
                    style={{ height: "calc(100% + 0.5rem)" }}
                  />
                )}
                <GoalTreeNode
                  goal={childGoal}
                  childGoals={getChildGoals(childGoal.id)}
                  allGoals={allGoals}
                  level={level + 1}
                  onGoalClick={onGoalClick}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
