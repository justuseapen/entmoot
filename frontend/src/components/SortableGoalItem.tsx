import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "react-router-dom";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDueDate, isOverdue, isDueSoon, type Goal } from "@/lib/goals";

interface SortableGoalItemProps {
  goal: Goal;
  familyId: number;
}

export function SortableGoalItem({ goal, familyId }: SortableGoalItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-amber-200 bg-white p-4",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="text-muted-foreground hover:text-foreground mt-0.5 cursor-grab touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <Link
              to={`/families/${familyId}/goals?goalId=${goal.id}`}
              className="font-medium hover:text-amber-700 hover:underline"
            >
              {goal.title}
            </Link>
            {goal.due_date && (
              <p
                className={cn(
                  "mt-1 text-xs",
                  isOverdue(goal.due_date)
                    ? "font-medium text-red-600"
                    : isDueSoon(goal.due_date)
                      ? "font-medium text-amber-600"
                      : "text-muted-foreground"
                )}
              >
                {isOverdue(goal.due_date)
                  ? "Overdue"
                  : `Due ${formatDueDate(goal.due_date)}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {goal.draft_children_count > 0 && (
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-100 text-amber-800"
            >
              {goal.draft_children_count} draft
              {goal.draft_children_count === 1 ? "" : "s"}
            </Badge>
          )}
          {goal.children_count > 0 && (
            <span className="text-muted-foreground text-xs">
              {goal.children_count} sub-goal
              {goal.children_count === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{goal.aggregated_progress}%</span>
        </div>
        <Progress value={goal.aggregated_progress} className="h-2" />
      </div>
      {goal.draft_children_count > 0 && (
        <div className="mt-3">
          <Button asChild size="sm" variant="outline">
            <Link to={`/families/${familyId}/goals/tree`}>
              Review Draft Sub-Goals
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
