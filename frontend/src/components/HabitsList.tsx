import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useHabits,
  useDeleteHabit,
  useUpdateHabitPositions,
} from "@/hooks/useHabits";
import { type Habit } from "@/lib/habits";
import { SortableHabitItem } from "@/components/SortableHabitItem";
import { HabitModal } from "@/components/HabitModal";

interface HabitsListProps {
  familyId: number;
}

export function HabitsList({ familyId }: HabitsListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: habits, isLoading, error } = useHabits(familyId);
  const deleteHabit = useDeleteHabit(familyId);
  const updatePositions = useUpdateHabitPositions(familyId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id || !habits) return;

      const oldIndex = habits.findIndex((h) => h.id.toString() === active.id);
      const newIndex = habits.findIndex((h) => h.id.toString() === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Create new positions array
      const reordered = [...habits];
      const [movedItem] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, movedItem);

      const positions = reordered.map((habit, index) => ({
        id: habit.id,
        position: index + 1,
      }));

      updatePositions.mutate(positions);
    },
    [habits, updatePositions]
  );

  const confirmDelete = async () => {
    if (!deletingHabit) return;

    setDeleteError(null);
    try {
      await deleteHabit.mutateAsync(deletingHabit.id);
      setDeletingHabit(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete habit"
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Non-Negotiables</CardTitle>
          <CardDescription>Loading habits...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Non-Negotiables</CardTitle>
          <CardDescription className="text-destructive">
            {error instanceof Error ? error.message : "Failed to load habits"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Non-Negotiables</CardTitle>
              <CardDescription>
                Your daily habits to track. Drag to reorder.
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddModal(true)}>Add Habit</Button>
          </div>
        </CardHeader>
        <CardContent>
          {habits && habits.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={habits.map((h) => h.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {habits.map((habit) => (
                    <SortableHabitItem
                      key={habit.id}
                      habit={habit}
                      onEdit={setEditingHabit}
                      onDelete={setDeletingHabit}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-4xl">📋</p>
              <p className="text-muted-foreground mt-2">
                No habits yet. Add your first non-negotiable!
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setShowAddModal(true)}
              >
                Add Your First Habit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Habit Modal */}
      <HabitModal
        familyId={familyId}
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />

      {/* Edit Habit Modal */}
      <HabitModal
        familyId={familyId}
        habit={editingHabit}
        open={!!editingHabit}
        onOpenChange={(open) => {
          if (!open) setEditingHabit(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingHabit}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingHabit(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Habit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingHabit?.name}&quot;?
              This will also delete all completion history for this habit.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {deleteError}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletingHabit(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteHabit.isPending}
            >
              {deleteHabit.isPending ? "Deleting..." : "Delete Habit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
