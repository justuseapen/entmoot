import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { SortableTaskItem } from "@/components/SortableTaskItem";
import { useTodaysPlan, useUpdateDailyPlan } from "@/hooks/useDailyPlans";
import { useGoals } from "@/hooks/useGoals";
import { useFamily } from "@/hooks/useFamilies";
import { useHabits } from "@/hooks/useHabits";
import { useCelebration } from "@/components/CelebrationToast";
import {
  formatTodayDate,
  type DailyTask,
  type TopPriority,
  type DailyTaskAttributes,
  type TopPriorityAttributes,
  type HabitCompletion,
  type HabitCompletionAttributes,
} from "@/lib/dailyPlans";
import {
  Plus,
  Target,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Save,
  Loader2,
  Check,
  Link2,
  X,
  ListChecks,
  Sunset,
} from "lucide-react";
import { StandaloneTip } from "@/components/TipTooltip";
import { InlineEmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { getTimeScaleLabel } from "@/lib/goals";

export function DailyPlanner() {
  const { id } = useParams<{ id: string }>();
  const familyId = parseInt(id || "0");
  const { celebrateFirstAction } = useCelebration();

  // Fetch data
  const {
    data: plan,
    isLoading: loadingPlan,
    error: planError,
  } = useTodaysPlan(familyId);
  const { data: family, isLoading: loadingFamily } = useFamily(familyId);
  const { data: goals } = useGoals(familyId);
  const { data: habits } = useHabits(familyId);
  const updatePlan = useUpdateDailyPlan(familyId);

  // Local state for new task input
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Save status state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Derive initial values from plan data
  const initialIntention = plan?.intention || "";
  const initialTasks = useMemo(() => plan?.daily_tasks || [], [plan]);
  const initialPriorities = useMemo(() => plan?.top_priorities || [], [plan]);
  const initialHabitCompletions = useMemo(
    () => plan?.habit_completions || [],
    [plan]
  );
  const initialShutdownShipped = plan?.shutdown_shipped || "";
  const initialShutdownBlocked = plan?.shutdown_blocked || "";

  // Local edits state (tracks modifications on top of server data)
  const [localIntention, setLocalIntention] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<DailyTask[] | null>(null);
  const [localPriorities, setLocalPriorities] = useState<TopPriority[] | null>(
    null
  );
  const [localHabitCompletions, setLocalHabitCompletions] = useState<
    HabitCompletion[] | null
  >(null);
  const [localShutdownShipped, setLocalShutdownShipped] = useState<
    string | null
  >(null);
  const [localShutdownBlocked, setLocalShutdownBlocked] = useState<
    string | null
  >(null);

  // Use local edits if they exist, otherwise use server data
  const intention = localIntention ?? initialIntention;
  const tasks = localTasks ?? initialTasks;
  const priorities = localPriorities ?? initialPriorities;
  const habitCompletions = localHabitCompletions ?? initialHabitCompletions;
  const shutdownShipped = localShutdownShipped ?? initialShutdownShipped;
  const shutdownBlocked = localShutdownBlocked ?? initialShutdownBlocked;

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Clear save status timeout on unmount
  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
    };
  }, []);

  // Save changes to the server
  const saveChanges = useCallback(
    async (
      newTasks?: DailyTask[],
      newPriorities?: TopPriority[],
      newIntention?: string,
      newHabitCompletions?: HabitCompletion[],
      newShutdownShipped?: string,
      newShutdownBlocked?: string
    ) => {
      if (!plan) return;

      // Clear any existing timeout
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }

      setSaveStatus("saving");

      const tasksToSave = newTasks ?? tasks;
      const prioritiesToSave = newPriorities ?? priorities;
      const intentionToSave = newIntention ?? intention;
      const habitCompletionsToSave = newHabitCompletions ?? habitCompletions;
      const shutdownShippedToSave = newShutdownShipped ?? shutdownShipped;
      const shutdownBlockedToSave = newShutdownBlocked ?? shutdownBlocked;

      const taskAttributes: DailyTaskAttributes[] = tasksToSave.map(
        (task, index) => ({
          id: task.id,
          title: task.title,
          completed: task.completed,
          position: index,
          goal_id: task.goal_id,
          _destroy: task._destroy,
        })
      );

      const priorityAttributes: TopPriorityAttributes[] = prioritiesToSave.map(
        (priority) => ({
          id: priority.id,
          title: priority.title,
          priority_order: priority.priority_order,
          goal_id: priority.goal_id,
          _destroy: priority._destroy,
        })
      );

      const habitCompletionAttributes: HabitCompletionAttributes[] =
        habitCompletionsToSave.map((hc) => ({
          // Only include id if it's an existing record (id > 0)
          ...(hc.id > 0 ? { id: hc.id } : {}),
          habit_id: hc.habit_id,
          completed: hc.completed,
        }));

      try {
        const result = await updatePlan.mutateAsync({
          planId: plan.id,
          data: {
            intention: intentionToSave,
            daily_tasks_attributes: taskAttributes,
            top_priorities_attributes: priorityAttributes,
            habit_completions_attributes: habitCompletionAttributes,
            shutdown_shipped: shutdownShippedToSave,
            shutdown_blocked: shutdownBlockedToSave,
          },
        });
        // Clear local edits after successful save (server data will be updated via query invalidation)
        setLocalIntention(null);
        setLocalTasks(null);
        setLocalPriorities(null);
        setLocalHabitCompletions(null);
        setLocalShutdownShipped(null);
        setLocalShutdownBlocked(null);

        // Show saved status
        setSaveStatus("saved");
        saveStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);

        // Celebrate first daily plan completion
        if (result.is_first_action) {
          celebrateFirstAction("first_daily_plan");
        }
      } catch (error) {
        console.error("Failed to save changes:", error);
        setSaveStatus("idle");
      }
    },
    [
      plan,
      tasks,
      priorities,
      intention,
      habitCompletions,
      shutdownShipped,
      shutdownBlocked,
      updatePlan,
      celebrateFirstAction,
    ]
  );

  // Handle drag end for task reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => `task-${t.id}` === active.id);
      const newIndex = tasks.findIndex((t) => `task-${t.id}` === over.id);

      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex).map(
        (task, index) => ({
          ...task,
          position: index,
        })
      );

      setLocalTasks(reorderedTasks);
      saveChanges(reorderedTasks);
    }
  };

  // Task handlers
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: DailyTask = {
      title: newTaskTitle.trim(),
      completed: false,
      position: tasks.length,
      goal_id: null,
      goal: null,
    };

    const newTasks = [...tasks, newTask];
    setLocalTasks(newTasks);
    setNewTaskTitle("");
    saveChanges(newTasks);
  };

  const handleToggleTask = (index: number) => {
    const newTasks = tasks.map((task, i) =>
      i === index ? { ...task, completed: !task.completed } : task
    );
    setLocalTasks(newTasks);
    saveChanges(newTasks);
  };

  const handleRemoveTask = (index: number) => {
    const taskToRemove = tasks[index];
    if (taskToRemove.id) {
      // Mark for deletion on server
      const newTasks = tasks.map((task, i) =>
        i === index ? { ...task, _destroy: true } : task
      );
      setLocalTasks(newTasks);
      saveChanges(newTasks);
    } else {
      // Just remove from local state (not yet saved)
      const newTasks = tasks.filter((_, i) => i !== index);
      setLocalTasks(newTasks);
      saveChanges(newTasks);
    }
  };

  const handleLinkTaskToGoal = (index: number, goalId: number | null) => {
    const selectedGoal = goals?.find((g) => g.id === goalId);
    const newTasks = tasks.map((task, i) =>
      i === index
        ? {
            ...task,
            goal_id: goalId,
            goal: selectedGoal
              ? {
                  id: selectedGoal.id,
                  title: selectedGoal.title,
                  time_scale: selectedGoal.time_scale,
                  status: selectedGoal.status,
                }
              : null,
          }
        : task
    );
    setLocalTasks(newTasks);
    saveChanges(newTasks);
  };

  // Priority handlers
  const handlePriorityChange = (index: number, title: string) => {
    const currentPriorities = ensureThreePriorities();
    const newPriorities = currentPriorities.map((p, i) =>
      i === index ? { ...p, title } : p
    );
    setLocalPriorities(newPriorities);
  };

  const handlePriorityBlur = () => {
    if (localPriorities) {
      saveChanges(undefined, localPriorities);
    }
  };

  const handleLinkPriorityToGoal = (index: number, goalId: number | null) => {
    const currentPriorities = ensureThreePriorities();
    const selectedGoal = goals?.find((g) => g.id === goalId);
    const newPriorities = currentPriorities.map((p, i) =>
      i === index
        ? {
            ...p,
            goal_id: goalId,
            goal: selectedGoal
              ? {
                  id: selectedGoal.id,
                  title: selectedGoal.title,
                  time_scale: selectedGoal.time_scale,
                  status: selectedGoal.status,
                }
              : null,
          }
        : p
    );
    setLocalPriorities(newPriorities);
    saveChanges(undefined, newPriorities);
  };

  const ensureThreePriorities = useCallback((): TopPriority[] => {
    const currentPriorities = [...priorities];
    while (currentPriorities.length < 3) {
      currentPriorities.push({
        title: "",
        priority_order: currentPriorities.length + 1,
        goal_id: null,
        goal: null,
      });
    }
    return currentPriorities.slice(0, 3);
  }, [priorities]);

  // Habit completion handler
  const handleToggleHabitCompletion = (habitId: number, completed: boolean) => {
    // Find existing completion or create a new one
    const existingCompletion = habitCompletions.find(
      (hc) => hc.habit_id === habitId
    );
    const habit = habits?.find((h) => h.id === habitId);

    if (existingCompletion) {
      // Update existing completion
      const newHabitCompletions = habitCompletions.map((hc) =>
        hc.habit_id === habitId ? { ...hc, completed } : hc
      );
      setLocalHabitCompletions(newHabitCompletions);
      saveChanges(undefined, undefined, undefined, newHabitCompletions);
    } else if (habit) {
      // Create new completion
      const newCompletion: HabitCompletion = {
        id: 0, // Will be assigned by server
        habit_id: habitId,
        daily_plan_id: plan?.id || 0,
        completed,
        habit,
      };
      const newHabitCompletions = [...habitCompletions, newCompletion];
      setLocalHabitCompletions(newHabitCompletions);
      saveChanges(undefined, undefined, undefined, newHabitCompletions);
    }
  };

  // Shutdown notes handlers
  const handleShutdownShippedChange = (value: string) => {
    setLocalShutdownShipped(value);
  };

  const handleShutdownShippedBlur = () => {
    if (localShutdownShipped !== null) {
      saveChanges(
        undefined,
        undefined,
        undefined,
        undefined,
        localShutdownShipped
      );
    }
  };

  const handleShutdownBlockedChange = (value: string) => {
    setLocalShutdownBlocked(value);
  };

  const handleShutdownBlockedBlur = () => {
    if (localShutdownBlocked !== null) {
      saveChanges(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        localShutdownBlocked
      );
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    localIntention !== null ||
    localTasks !== null ||
    localPriorities !== null ||
    localHabitCompletions !== null ||
    localShutdownShipped !== null ||
    localShutdownBlocked !== null;

  // Manual save handler
  const handleManualSave = () => {
    saveChanges(
      localTasks ?? undefined,
      localPriorities ?? undefined,
      localIntention ?? undefined,
      localHabitCompletions ?? undefined,
      localShutdownShipped ?? undefined,
      localShutdownBlocked ?? undefined
    );
  };

  // Carry over incomplete tasks from yesterday
  const handleCarryOverTask = (task: DailyTask) => {
    const newTask: DailyTask = {
      title: task.title,
      completed: false,
      position: tasks.length,
      goal_id: task.goal_id,
      goal: task.goal,
    };
    const newTasks = [...tasks, newTask];
    setLocalTasks(newTasks);
    saveChanges(newTasks);
  };

  // Loading and error states
  if (loadingPlan || loadingFamily) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-muted-foreground">Loading your daily plan...</div>
      </div>
    );
  }

  if (planError || !plan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="text-destructive">Failed to load daily plan</div>
        <Button asChild variant="outline">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const visibleTasks = tasks.filter((t) => !t._destroy);
  const completionPercentage =
    visibleTasks.length > 0
      ? Math.round(
          (visibleTasks.filter((t) => t.completed).length /
            visibleTasks.length) *
            100
        )
      : 0;
  const displayPriorities = ensureThreePriorities();
  const yesterdayIncompleteTasks = plan.yesterday_incomplete_tasks || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            {family?.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {formatTodayDate()}
          </h1>
          <p className="text-muted-foreground mt-2">
            Start your day with intention
          </p>
        </div>

        {/* Save Status Bar */}
        <div className="mb-6 flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-600">Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Saved</span>
              </>
            )}
            {saveStatus === "idle" && !hasUnsavedChanges && (
              <>
                <Check className="h-4 w-4 text-gray-400" />
                <span className="text-muted-foreground text-sm">
                  All changes saved
                </span>
              </>
            )}
            {saveStatus === "idle" && hasUnsavedChanges && (
              <>
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-sm text-amber-600">Unsaved changes</span>
              </>
            )}
          </div>
          <Button
            onClick={handleManualSave}
            disabled={saveStatus === "saving" || !hasUnsavedChanges}
            size="sm"
            variant={hasUnsavedChanges ? "default" : "outline"}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>

        {/* Tip for first daily plan */}
        <StandaloneTip tipType="first_daily_plan" className="mb-4" />

        {/* Progress Indicator */}
        {visibleTasks.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Today&apos;s Progress</span>
                </div>
                <span className="text-muted-foreground text-sm">
                  {visibleTasks.filter((t) => t.completed).length} of{" "}
                  {visibleTasks.length} tasks
                </span>
              </div>
              <Progress value={completionPercentage} className="mt-3 h-2" />
              <p className="text-muted-foreground mt-2 text-center text-sm">
                {completionPercentage}% complete
              </p>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Outcomes Today */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="text-primary h-5 w-5" />
              Top 3 Outcomes Today
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              What tasks drive your weekly plan forward?
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayPriorities.map((priority, index) => {
              // Filter goals to non-daily only
              const filteredGoals =
                goals?.filter((g) => g.time_scale !== "daily") || [];
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                      {index + 1}
                    </span>
                    <Input
                      placeholder={`Outcome ${index + 1}`}
                      value={priority.title}
                      onChange={(e) =>
                        handlePriorityChange(index, e.target.value)
                      }
                      onBlur={handlePriorityBlur}
                      className="flex-1"
                    />
                    <Select
                      value={priority.goal_id?.toString() || ""}
                      onValueChange={(value) =>
                        handleLinkPriorityToGoal(
                          index,
                          value ? parseInt(value) : null
                        )
                      }
                    >
                      <SelectTrigger className="w-10 shrink-0" size="sm">
                        <Link2 className="h-4 w-4" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredGoals.length > 0 ? (
                          filteredGoals.map((goal) => (
                            <SelectItem
                              key={goal.id}
                              value={goal.id.toString()}
                            >
                              <span className="truncate">{goal.title}</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                ({getTimeScaleLabel(goal.time_scale)})
                              </span>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-muted-foreground px-2 py-1.5 text-sm">
                            No goals available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {priority.goal && (
                    <div className="ml-10 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getTimeScaleLabel(
                          priority.goal.time_scale as
                            | "daily"
                            | "weekly"
                            | "monthly"
                            | "quarterly"
                            | "annual"
                        )}
                        : {priority.goal.title}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => handleLinkPriorityToGoal(index, null)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Non-Negotiables Habit Tracker */}
        {habits && habits.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <ListChecks className="text-primary h-5 w-5" />
                  Non-Negotiables
                </div>
                <span className="text-muted-foreground text-sm font-normal">
                  {habitCompletions.filter((hc) => hc.completed).length}/
                  {habits.length} complete
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {habits.map((habit) => {
                  const completion = habitCompletions.find(
                    (hc) => hc.habit_id === habit.id
                  );
                  const isCompleted = completion?.completed ?? false;
                  return (
                    <label
                      key={habit.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border p-3 transition-colors hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={(checked) =>
                          handleToggleHabitCompletion(habit.id, checked === true)
                        }
                      />
                      <span
                        className={`text-sm ${isCompleted ? "text-muted-foreground line-through" : ""}`}
                      >
                        {habit.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Previous Day Incomplete Tasks */}
        {yesterdayIncompleteTasks.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
                <AlertCircle className="h-5 w-5" />
                Yesterday&apos;s Unfinished Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {yesterdayIncompleteTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg bg-white p-3"
                  >
                    <span className="text-sm">{task.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCarryOverTask(task)}
                      className="text-primary hover:text-primary"
                    >
                      <ArrowRight className="mr-1 h-4 w-4" />
                      Carry over
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Checklist */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="text-primary h-5 w-5" />
              Today&apos;s Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Quick add task input */}
            <div className="mb-4 flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleAddTask} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Task list with drag and drop */}
            {visibleTasks.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={visibleTasks.map((t) => `task-${t.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {visibleTasks.map((task, index) => (
                      <SortableTaskItem
                        key={task.id || `new-${index}`}
                        id={`task-${task.id}`}
                        task={task}
                        index={index}
                        goals={goals || []}
                        onToggle={() => handleToggleTask(index)}
                        onRemove={() => handleRemoveTask(index)}
                        onLinkToGoal={(goalId) =>
                          handleLinkTaskToGoal(index, goalId)
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <InlineEmptyState
                variant="daily_plans"
                emoji="✅"
                title="No tasks yet"
                description="Add your first task above to start planning your day!"
                showAction={false}
              />
            )}
          </CardContent>
        </Card>

        {/* Shutdown Notes */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sunset className="text-primary h-5 w-5" />
              Shutdown Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                What shipped today?
              </label>
              <Textarea
                placeholder="What did you accomplish? What got done?"
                value={shutdownShipped}
                onChange={(e) => handleShutdownShippedChange(e.target.value)}
                onBlur={handleShutdownShippedBlur}
                className="mt-1.5 min-h-[80px] resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                What blocked me?
              </label>
              <Textarea
                placeholder="What obstacles or blockers did you encounter?"
                value={shutdownBlocked}
                onChange={(e) => handleShutdownBlockedChange(e.target.value)}
                onBlur={handleShutdownBlockedBlur}
                className="mt-1.5 min-h-[80px] resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild variant="outline">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/families/${familyId}/goals`}>Goals</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/families/${familyId}/reflection`}>
              Evening Reflection
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/families/${familyId}/weekly-review`}>
              Weekly Review
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
