import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Target } from "lucide-react";
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
  arrayMove,
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
import { SortableGoalItem } from "@/components/SortableGoalItem";
import { useAnnualGoals, useUpdateGoalPositions } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";
import { type Goal } from "@/lib/goals";

interface AnnualGoalsSectionProps {
  familyId: number;
}

export function AnnualGoalsSection({ familyId }: AnnualGoalsSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const { data: annualGoals, isLoading } = useAnnualGoals(familyId);
  const updatePositions = useUpdateGoalPositions(familyId);

  // Filter to only show active annual goals (not completed or abandoned)
  const activeAnnualGoals = useMemo(
    () =>
      annualGoals?.filter(
        (goal) => goal.status !== "completed" && goal.status !== "abandoned"
      ) ?? [],
    [annualGoals]
  );

  // Local state for optimistic updates during drag
  const [localGoals, setLocalGoals] = useState<Goal[] | null>(null);

  // Use local state only while mutation is pending, otherwise use server data
  const goalsToDisplay = useMemo(() => {
    // Use local state only if mutation is pending and we have local goals
    if (updatePositions.isPending && localGoals) {
      return localGoals;
    }
    return activeAnnualGoals;
  }, [updatePositions.isPending, localGoals, activeAnnualGoals]);

  // Display only top 3 goals on the dashboard widget
  const displayedGoals = goalsToDisplay.slice(0, 3);
  const hasMoreGoals = activeAnnualGoals.length > 3;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activeAnnualGoals.findIndex(
        (g) => g.id.toString() === active.id
      );
      const newIndex = activeAnnualGoals.findIndex(
        (g) => g.id.toString() === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        // Optimistic update
        const newOrder = arrayMove(activeAnnualGoals, oldIndex, newIndex);
        setLocalGoals(newOrder);

        // Persist to server
        const positions = newOrder.map((goal, index) => ({
          id: goal.id,
          position: index + 1,
        }));

        updatePositions.mutate(positions, {
          onError: () => {
            // Revert on error
            setLocalGoals(null);
          },
          onSuccess: () => {
            // Clear local state to use server data
            setLocalGoals(null);
          },
        });
      }
    }
  };

  // Don't render if no annual goals
  if (!isLoading && activeAnnualGoals.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader
        className="cursor-pointer pb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Annual Goals</CardTitle>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-amber-600 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
        <CardDescription>Your north star goals for the year</CardDescription>
      </CardHeader>
      {expanded && (
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <div className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayedGoals.map((g) => g.id.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {displayedGoals.map((goal) => (
                      <SortableGoalItem
                        key={goal.id}
                        goal={goal}
                        familyId={familyId}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <div className="flex justify-end">
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/families/${familyId}/goals?time_scale=annual`}>
                    {hasMoreGoals
                      ? `View All ${activeAnnualGoals.length} Annual Goals`
                      : "View All Annual Goals"}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
