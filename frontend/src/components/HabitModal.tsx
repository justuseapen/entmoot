import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateHabit, useUpdateHabit } from "@/hooks/useHabits";
import { type Habit } from "@/lib/habits";

const habitSchema = z.object({
  name: z.string().min(1, "Habit name is required").max(100, "Name too long"),
});

type HabitFormData = z.infer<typeof habitSchema>;

interface HabitModalProps {
  familyId: number;
  habit?: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HabitModal({
  familyId,
  habit,
  open,
  onOpenChange,
}: HabitModalProps) {
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!habit;

  const createHabit = useCreateHabit(familyId);
  const updateHabit = useUpdateHabit(familyId, habit?.id ?? 0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      reset({ name: habit?.name ?? "" });
    }
  }, [open, habit, reset]);

  const onSubmit = async (data: HabitFormData) => {
    setError(null);
    try {
      if (isEditing) {
        await updateHabit.mutateAsync({ name: data.name });
      } else {
        await createHabit.mutateAsync({ name: data.name });
      }
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditing ? "update" : "add"} habit`
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Habit" : "Add New Habit"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your non-negotiable habit."
              : "Add a new non-negotiable habit to track daily."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Habit Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Morning Meditation"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Adding..."
                : isEditing
                  ? "Save Changes"
                  : "Add Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
