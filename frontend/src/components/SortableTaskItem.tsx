import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { type DailyTask } from "@/lib/dailyPlans";
import { type Goal } from "@/lib/goals";
import { GripVertical, Link2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableTaskItemProps {
  id: string;
  task: DailyTask;
  index: number;
  goals: Goal[];
  onToggle: () => void;
  onRemove: () => void;
  onLinkToGoal: (goalId: number | null) => void;
}

export function SortableTaskItem({
  id,
  task,
  goals,
  onToggle,
  onRemove,
  onLinkToGoal,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-white p-3",
        isDragging && "opacity-50 shadow-lg",
        task.completed && "bg-gray-50"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Checkbox */}
      <Checkbox
        checked={task.completed}
        onCheckedChange={onToggle}
        className="shrink-0"
      />

      {/* Task title */}
      <span
        className={cn(
          "flex-1 text-sm",
          task.completed && "text-muted-foreground line-through"
        )}
      >
        {task.title}
      </span>

      {/* Goal link indicator */}
      {task.goal && (
        <span className="text-muted-foreground max-w-32 truncate text-xs">
          {task.goal.title}
        </span>
      )}

      {/* Link to goal button */}
      <Select
        value={task.goal_id?.toString() || "none"}
        onValueChange={(value) =>
          onLinkToGoal(value === "none" ? null : parseInt(value))
        }
      >
        <SelectTrigger className="h-8 w-8 border-0 p-0 [&>svg]:hidden">
          <Link2
            className={cn(
              "h-4 w-4",
              task.goal_id ? "text-primary" : "text-muted-foreground"
            )}
          />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="none">No linked goal</SelectItem>
          {goals.map((goal) => (
            <SelectItem key={goal.id} value={goal.id.toString()}>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs capitalize">
                  [{goal.time_scale}]
                </span>
                {goal.title}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive h-8 w-8"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
