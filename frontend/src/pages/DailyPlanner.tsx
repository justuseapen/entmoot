import { useState, useCallback, useMemo } from "react";
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
import {
  formatTodayDate,
  type DailyTask,
  type TopPriority,
  type DailyTaskAttributes,
  type TopPriorityAttributes,
} from "@/lib/dailyPlans";
import {
  Plus,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export function DailyPlanner() {
  const { id } = useParams<{ id: string }>();
  const familyId = parseInt(id || "0");

  // Fetch data
  const {
    data: plan,
    isLoading: loadingPlan,
    error: planError,
  } = useTodaysPlan(familyId);
  const { data: family, isLoading: loadingFamily } = useFamily(familyId);
  const { data: goals } = useGoals(familyId);
  const updatePlan = useUpdateDailyPlan(familyId);

  // Local state for new task input
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Derive initial values from plan data
  const initialIntention = plan?.intention || "";
  const initialTasks = useMemo(() => plan?.daily_tasks || [], [plan]);
  const initialPriorities = useMemo(() => plan?.top_priorities || [], [plan]);

  // Local edits state (tracks modifications on top of server data)
  const [localIntention, setLocalIntention] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<DailyTask[] | null>(null);
  const [localPriorities, setLocalPriorities] = useState<TopPriority[] | null>(
    null
  );

  // Use local edits if they exist, otherwise use server data
  const intention = localIntention ?? initialIntention;
  const tasks = localTasks ?? initialTasks;
  const priorities = localPriorities ?? initialPriorities;

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Save changes to the server
  const saveChanges = useCallback(
    async (
      newTasks?: DailyTask[],
      newPriorities?: TopPriority[],
      newIntention?: string
    ) => {
      if (!plan) return;

      const tasksToSave = newTasks ?? tasks;
      const prioritiesToSave = newPriorities ?? priorities;
      const intentionToSave = newIntention ?? intention;

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

      try {
        await updatePlan.mutateAsync({
          planId: plan.id,
          data: {
            intention: intentionToSave,
            daily_tasks_attributes: taskAttributes,
            top_priorities_attributes: priorityAttributes,
          },
        });
        // Clear local edits after successful save (server data will be updated via query invalidation)
        setLocalIntention(null);
        setLocalTasks(null);
        setLocalPriorities(null);
      } catch (error) {
        console.error("Failed to save changes:", error);
      }
    },
    [plan, tasks, priorities, intention, updatePlan]
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

  // Intention handlers
  const handleIntentionChange = (value: string) => {
    setLocalIntention(value);
  };

  const handleIntentionBlur = () => {
    if (localIntention !== null) {
      saveChanges(undefined, undefined, localIntention);
    }
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

        {/* Top 3 Priorities */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="text-primary h-5 w-5" />
              Top 3 Priorities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayPriorities.map((priority, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                  {index + 1}
                </span>
                <Input
                  placeholder={`Priority ${index + 1}`}
                  value={priority.title}
                  onChange={(e) => handlePriorityChange(index, e.target.value)}
                  onBlur={handlePriorityBlur}
                  className="flex-1"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Daily Intention */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="text-primary h-5 w-5" />
              Daily Intention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="What's your intention for today? How do you want to show up?"
              value={intention}
              onChange={(e) => handleIntentionChange(e.target.value)}
              onBlur={handleIntentionBlur}
              className="min-h-[80px] resize-none"
            />
          </CardContent>
        </Card>

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
              <div className="text-muted-foreground py-8 text-center">
                <p>No tasks yet. Add your first task above!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/families/${familyId}/goals`}>Goals</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
