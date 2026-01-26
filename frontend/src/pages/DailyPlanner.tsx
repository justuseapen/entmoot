import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MentionInput } from "@/components/ui/mention-input";
import {
  useTodaysPlan,
  useDailyPlans,
  useUpdateDailyPlan,
} from "@/hooks/useDailyPlans";
import { useGoals } from "@/hooks/useGoals";
import { useFamily } from "@/hooks/useFamilies";
import { useHabits } from "@/hooks/useHabits";
import { useCelebration } from "@/components/CelebrationToast";
import {
  formatTodayDate,
  type TopPriority,
  type TopPriorityAttributes,
  type HabitCompletion,
  type HabitCompletionAttributes,
} from "@/lib/dailyPlans";
import {
  Target,
  Save,
  Loader2,
  Check,
  Link2,
  X,
  ListChecks,
  Sunset,
} from "lucide-react";
import { StandaloneTip } from "@/components/TipTooltip";
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
  const [searchParams] = useSearchParams();
  const familyId = parseInt(id || "0");
  const { celebrateFirstAction } = useCelebration();

  // Check if a specific date was requested
  const requestedDate = searchParams.get("date");

  // Fetch data - use today's plan if no date specified, otherwise fetch all plans
  const {
    data: todayPlan,
    isLoading: loadingTodayPlan,
    error: todayPlanError,
  } = useTodaysPlan(familyId);
  const {
    data: allPlans,
    isLoading: loadingAllPlans,
  } = useDailyPlans(familyId, undefined);

  // Determine which plan to display
  const plan = useMemo(() => {
    if (requestedDate && allPlans) {
      return allPlans.find((p) => p.date === requestedDate);
    }
    return todayPlan;
  }, [requestedDate, allPlans, todayPlan]);

  const isLoading = requestedDate ? loadingAllPlans : loadingTodayPlan;
  const planError = requestedDate ? undefined : todayPlanError;

  // Check if viewing a historical date (read-only mode)
  const isHistoricalView = requestedDate !== null;
  const isToday = plan?.date === new Date().toISOString().split("T")[0];

  const { data: family, isLoading: loadingFamily } = useFamily(familyId);
  const { data: goals } = useGoals(familyId);
  const { data: habits } = useHabits(familyId);
  const updatePlan = useUpdateDailyPlan(familyId);

  // Save status state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Derive initial values from plan data
  const initialIntention = plan?.intention || "";
  const initialPriorities = useMemo(() => plan?.top_priorities || [], [plan]);
  const initialHabitCompletions = useMemo(
    () => plan?.habit_completions || [],
    [plan]
  );
  const initialShutdownShipped = plan?.shutdown_shipped || "";
  const initialShutdownBlocked = plan?.shutdown_blocked || "";

  // Local edits state (tracks modifications on top of server data)
  const [localIntention, setLocalIntention] = useState<string | null>(null);
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
  const priorities = localPriorities ?? initialPriorities;
  const habitCompletions = localHabitCompletions ?? initialHabitCompletions;
  const shutdownShipped = localShutdownShipped ?? initialShutdownShipped;
  const shutdownBlocked = localShutdownBlocked ?? initialShutdownBlocked;

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

      const prioritiesToSave = newPriorities ?? priorities;
      const intentionToSave = newIntention ?? intention;
      const habitCompletionsToSave = newHabitCompletions ?? habitCompletions;
      const shutdownShippedToSave = newShutdownShipped ?? shutdownShipped;
      const shutdownBlockedToSave = newShutdownBlocked ?? shutdownBlocked;

      // Filter out empty priorities (without id) and mark empty existing priorities for deletion
      const priorityAttributes: TopPriorityAttributes[] =
        prioritiesToSave.reduce<TopPriorityAttributes[]>((acc, priority) => {
          // If priority has an id but empty title, mark for deletion
          if (priority.id && !priority.title.trim()) {
            acc.push({
              id: priority.id,
              title: priority.title,
              priority_order: priority.priority_order,
              goal_id: priority.goal_id,
              _destroy: true,
            });
          }
          // If priority has no id and empty title, skip it entirely
          else if (!priority.id && !priority.title.trim()) {
            // Skip - don't add to accumulator
          }
          // Otherwise include the priority normally
          else {
            acc.push({
              id: priority.id,
              title: priority.title,
              priority_order: priority.priority_order,
              goal_id: priority.goal_id,
              _destroy: priority._destroy,
            });
          }
          return acc;
        }, []);

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
            top_priorities_attributes: priorityAttributes,
            habit_completions_attributes: habitCompletionAttributes,
            shutdown_shipped: shutdownShippedToSave,
            shutdown_blocked: shutdownBlockedToSave,
          },
        });
        // Clear local edits after successful save (server data will be updated via query invalidation)
        setLocalIntention(null);
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
      priorities,
      intention,
      habitCompletions,
      shutdownShipped,
      shutdownBlocked,
      updatePlan,
      celebrateFirstAction,
    ]
  );

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
      saveChanges(localPriorities);
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
    saveChanges(newPriorities);
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
      saveChanges(undefined, undefined, newHabitCompletions);
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
      saveChanges(undefined, undefined, newHabitCompletions);
    }
  };

  // Shutdown notes handlers
  const handleShutdownShippedChange = (value: string) => {
    setLocalShutdownShipped(value);
  };

  const handleShutdownShippedBlur = () => {
    if (localShutdownShipped !== null) {
      saveChanges(undefined, undefined, undefined, localShutdownShipped);
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
        localShutdownBlocked
      );
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    localIntention !== null ||
    localPriorities !== null ||
    localHabitCompletions !== null ||
    localShutdownShipped !== null ||
    localShutdownBlocked !== null;

  // Manual save handler
  const handleManualSave = () => {
    saveChanges(
      localPriorities ?? undefined,
      localIntention ?? undefined,
      localHabitCompletions ?? undefined,
      localShutdownShipped ?? undefined,
      localShutdownBlocked ?? undefined
    );
  };

  // Loading and error states
  if (isLoading || loadingFamily) {
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

  const displayPriorities = ensureThreePriorities();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            {family?.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {plan?.date
              ? new Date(plan.date + "T00:00:00").toLocaleDateString(
                  undefined,
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year:
                      new Date(plan.date).getFullYear() !==
                      new Date().getFullYear()
                        ? "numeric"
                        : undefined,
                  }
                )
              : formatTodayDate()}
          </h1>
          <p className="text-muted-foreground mt-2">Daily Focus Card</p>
        </div>

        {/* Historical View Banner */}
        {isHistoricalView && !isToday && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-amber-900">
                  Viewing historical plan
                </span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={`/families/${familyId}/planner`}>
                  View Today&apos;s Plan
                </Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-2 text-sm text-amber-700">
              This is a read-only view of a past daily plan.
            </p>
          </div>
        )}

        {/* Save Status Bar - Only show for current/today's plans */}
        {!isHistoricalView || isToday ? (
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
        ) : null}

        {/* Tip for first daily plan */}
        <StandaloneTip tipType="first_daily_plan" className="mb-4" />

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
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <MentionInput
                        multiline={false}
                        placeholder={`Outcome ${index + 1}`}
                        value={priority.title}
                        onChange={(val) => handlePriorityChange(index, val)}
                        onBlur={handlePriorityBlur}
                        className="w-full"
                        disabled={isHistoricalView && !isToday}
                      />
                      <Select
                        value={priority.goal_id?.toString() || ""}
                        onValueChange={(value) =>
                          handleLinkPriorityToGoal(
                            index,
                            value ? parseInt(value) : null
                          )
                        }
                        disabled={isHistoricalView && !isToday}
                      >
                        <SelectTrigger
                          className="h-9 w-full shrink-0 text-sm"
                          aria-label="Link to goal"
                        >
                          <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4" />
                            <span className="text-muted-foreground text-xs">
                              {priority.goal_id
                                ? "Linked to goal"
                                : "Link to goal (optional)"}
                            </span>
                          </div>
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
                  </div>
                  {priority.goal && (
                    <div className="ml-13 flex items-center gap-2">
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
                        aria-label="Remove goal link"
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
                          handleToggleHabitCompletion(
                            habit.id,
                            checked === true
                          )
                        }
                        disabled={isHistoricalView && !isToday}
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
              <MentionInput
                placeholder="What did you accomplish? What got done? Use @name to mention family members"
                value={shutdownShipped}
                onChange={handleShutdownShippedChange}
                onBlur={handleShutdownShippedBlur}
                className="mt-1.5 min-h-[80px]"
                disabled={isHistoricalView && !isToday}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                What blocked me?
              </label>
              <MentionInput
                placeholder="What obstacles or blockers did you encounter? Use @name to mention family members"
                value={shutdownBlocked}
                onChange={handleShutdownBlockedChange}
                onBlur={handleShutdownBlockedBlur}
                className="mt-1.5 min-h-[80px]"
                disabled={isHistoricalView && !isToday}
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
