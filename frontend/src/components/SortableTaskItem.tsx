import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { type DailyTask } from "@/lib/dailyPlans";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableTaskItemProps {
  id: string;
  task: DailyTask;
  index: number;
  onToggle: () => void;
  onRemove: () => void;
}

export function SortableTaskItem({
  id,
  task,
  onToggle,
  onRemove,
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
