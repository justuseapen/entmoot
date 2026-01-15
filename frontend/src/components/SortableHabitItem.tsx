import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { type Habit } from "@/lib/habits";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableHabitItemProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
}

export function SortableHabitItem({
  habit,
  onEdit,
  onDelete,
}: SortableHabitItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-white p-3",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="flex-1 text-sm font-medium">{habit.name}</span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(habit)}
        className="h-8 w-8"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(habit)}
        className="text-muted-foreground hover:text-destructive h-8 w-8"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
