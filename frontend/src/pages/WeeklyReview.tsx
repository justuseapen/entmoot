import { useState, useCallback, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useFamily } from "@/hooks/useFamilies";
import {
  useCurrentWeeklyReview,
  useWeeklyReviews,
  useUpdateWeeklyReview,
} from "@/hooks/useWeeklyReviews";
import {
  formatWeekRange,
  getWeekNumber,
  WEEKLY_REVIEW_STEPS,
  type DailyPlanSummary,
} from "@/lib/weeklyReviews";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Trophy,
  AlertTriangle,
  Lightbulb,
  Target,
  Save,
  History,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  TrendingUp,
  ListChecks,
  Plus,
  X,
  FileText,
  ExternalLink,
  ClipboardList,
  Activity,
} from "lucide-react";
import { StandaloneTip } from "@/components/TipTooltip";
import { InlineEmptyState } from "@/components/EmptyState";

export function WeeklyReview() {
  const { id } = useParams<{ id: string }>();
  const familyId = parseInt(id || "0");
  const navigate = useNavigate();

  // Fetch data
  const { data: family, isLoading: loadingFamily } = useFamily(familyId);
  const { data: currentReview, isLoading: loadingReview } =
    useCurrentWeeklyReview(familyId);
  const { data: reviewsData, isLoading: loadingReviews } =
    useWeeklyReviews(familyId);

  // Mutations
  const updateReview = useUpdateWeeklyReview(familyId);

  // Local state
  const [currentStep, setCurrentStep] = useState(0);
  const [showPastReviews, setShowPastReviews] = useState(false);
  const [sourceReviewCompleted, setSourceReviewCompleted] = useState(false);
  // Section 1: Review (Evidence-based)
  const [winsShipped, setWinsShipped] = useState("");
  const [lossesFriction, setLossesFriction] = useState("");
  // Section 2: Metrics Snapshot
  const [workoutsCompleted, setWorkoutsCompleted] = useState<number | null>(
    null
  );
  const [workoutsPlanned, setWorkoutsPlanned] = useState<number | null>(null);
  const [walksCompleted, setWalksCompleted] = useState<number | null>(null);
  const [walksPlanned, setWalksPlanned] = useState<number | null>(7);
  const [writingSessionsCompleted, setWritingSessionsCompleted] = useState<
    number | null
  >(null);
  const [writingSessionsPlanned, setWritingSessionsPlanned] = useState<
    number | null
  >(null);
  const [houseResetsCompleted, setHouseResetsCompleted] = useState<
    number | null
  >(null);
  const [houseResetsPlanned, setHouseResetsPlanned] = useState<number | null>(
    7
  );
  const [mealsPrepHeld, setMealsPrepHeld] = useState<boolean | null>(null);
  const [metricsNotes, setMetricsNotes] = useState("");
  // Legacy fields
  const [wins, setWins] = useState<string[]>([""]);
  const [challenges, setChallenges] = useState<string[]>([""]);
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [priorities, setPriorities] = useState<string[]>(["", "", ""]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing review data
  useEffect(() => {
    if (currentReview) {
      // Section 0: Source Review
      setSourceReviewCompleted(currentReview.source_review_completed || false);
      // Section 1: Review (Evidence-based)
      setWinsShipped(currentReview.wins_shipped || "");
      setLossesFriction(currentReview.losses_friction || "");
      // Section 2: Metrics Snapshot
      setWorkoutsCompleted(currentReview.workouts_completed);
      setWorkoutsPlanned(currentReview.workouts_planned);
      setWalksCompleted(currentReview.walks_completed);
      setWalksPlanned(currentReview.walks_planned ?? 7);
      setWritingSessionsCompleted(currentReview.writing_sessions_completed);
      setWritingSessionsPlanned(currentReview.writing_sessions_planned);
      setHouseResetsCompleted(currentReview.house_resets_completed);
      setHouseResetsPlanned(currentReview.house_resets_planned ?? 7);
      setMealsPrepHeld(currentReview.meals_prepped_held);
      setMetricsNotes(currentReview.metrics_notes || "");
      // Legacy fields
      if (currentReview.wins?.length > 0) {
        setWins([...currentReview.wins, ""]);
      }
      if (currentReview.challenges?.length > 0) {
        setChallenges([...currentReview.challenges, ""]);
      }
      if (currentReview.lessons_learned) {
        setLessonsLearned(currentReview.lessons_learned);
      }
      if (currentReview.next_week_priorities?.length > 0) {
        const p = [...currentReview.next_week_priorities];
        while (p.length < 3) p.push("");
        setPriorities(p.slice(0, 5));
      }
    }
  }, [currentReview]);

  // Handle source review checkbox change (auto-save)
  const handleSourceReviewChange = useCallback(
    async (checked: boolean) => {
      if (!currentReview) return;
      setSourceReviewCompleted(checked);
      try {
        await updateReview.mutateAsync({
          reviewId: currentReview.id,
          data: { source_review_completed: checked },
        });
      } catch (error) {
        console.error("Failed to update source review:", error);
        // Revert on error
        setSourceReviewCompleted(!checked);
      }
    },
    [currentReview, updateReview]
  );

  // Handle Section 1 textarea blur (auto-save)
  const handleSection1Blur = useCallback(
    async (field: "wins_shipped" | "losses_friction", value: string) => {
      if (!currentReview) return;
      try {
        await updateReview.mutateAsync({
          reviewId: currentReview.id,
          data: { [field]: value },
        });
      } catch (error) {
        console.error(`Failed to update ${field}:`, error);
      }
    },
    [currentReview, updateReview]
  );

  // Handle Section 2 metrics field blur (auto-save)
  type MetricsNumberField =
    | "workouts_completed"
    | "workouts_planned"
    | "walks_completed"
    | "walks_planned"
    | "writing_sessions_completed"
    | "writing_sessions_planned"
    | "house_resets_completed"
    | "house_resets_planned";

  const handleMetricsNumberBlur = useCallback(
    async (field: MetricsNumberField, value: number | null) => {
      if (!currentReview) return;
      try {
        await updateReview.mutateAsync({
          reviewId: currentReview.id,
          data: { [field]: value },
        });
      } catch (error) {
        console.error(`Failed to update ${field}:`, error);
      }
    },
    [currentReview, updateReview]
  );

  const handleMealsPrepChange = useCallback(
    async (checked: boolean | null) => {
      if (!currentReview) return;
      setMealsPrepHeld(checked);
      try {
        await updateReview.mutateAsync({
          reviewId: currentReview.id,
          data: { meals_prepped_held: checked ?? undefined },
        });
      } catch (error) {
        console.error("Failed to update meals_prepped_held:", error);
        setMealsPrepHeld(mealsPrepHeld); // revert on error
      }
    },
    [currentReview, updateReview, mealsPrepHeld]
  );

  const handleMetricsNotesBlur = useCallback(async () => {
    if (!currentReview) return;
    try {
      await updateReview.mutateAsync({
        reviewId: currentReview.id,
        data: { metrics_notes: metricsNotes },
      });
    } catch (error) {
      console.error("Failed to update metrics_notes:", error);
    }
  }, [currentReview, updateReview, metricsNotes]);

  // Handle array item changes
  const handleArrayItemChange = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // Add new item to array
  const addArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[]
  ) => {
    if (current.length < 10) {
      setter([...current, ""]);
    }
  };

  // Remove item from array
  const removeArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  // Save review
  const handleSave = useCallback(async () => {
    if (!currentReview) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const filteredWins = wins.filter((w) => w.trim());
      const filteredChallenges = challenges.filter((c) => c.trim());
      const filteredPriorities = priorities.filter((p) => p.trim());

      await updateReview.mutateAsync({
        reviewId: currentReview.id,
        data: {
          wins: filteredWins,
          challenges: filteredChallenges,
          lessons_learned: lessonsLearned.trim() || undefined,
          next_week_priorities: filteredPriorities,
        },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save review:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    currentReview,
    wins,
    challenges,
    lessonsLearned,
    priorities,
    updateReview,
  ]);

  // Complete and save review
  const handleComplete = useCallback(async () => {
    if (!currentReview) return;

    setIsSaving(true);
    try {
      const filteredWins = wins.filter((w) => w.trim());
      const filteredChallenges = challenges.filter((c) => c.trim());
      const filteredPriorities = priorities.filter((p) => p.trim());

      await updateReview.mutateAsync({
        reviewId: currentReview.id,
        data: {
          wins: filteredWins,
          challenges: filteredChallenges,
          lessons_learned: lessonsLearned.trim() || undefined,
          next_week_priorities: filteredPriorities,
          completed: true,
        },
      });

      navigate(`/families/${familyId}/planner`);
    } catch (error) {
      console.error("Failed to complete review:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    currentReview,
    wins,
    challenges,
    lessonsLearned,
    priorities,
    updateReview,
    navigate,
    familyId,
  ]);

  // Navigate between steps
  const goNext = () => {
    if (currentStep < WEEKLY_REVIEW_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step icons
  const getStepIcon = (key: string) => {
    switch (key) {
      case "metrics":
        return <BarChart3 className="h-5 w-5" />;
      case "wins":
        return <Trophy className="h-5 w-5" />;
      case "challenges":
        return <AlertTriangle className="h-5 w-5" />;
      case "lessons":
        return <Lightbulb className="h-5 w-5" />;
      case "priorities":
        return <Target className="h-5 w-5" />;
      default:
        return <ListChecks className="h-5 w-5" />;
    }
  };

  // Generate all dates for the week starting from week_start_date
  const getWeekDates = (weekStartDate: string): Date[] => {
    const dates: Date[] = [];
    const start = new Date(weekStartDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Format date for display (e.g., "Mon Jan 20")
  const formatDayDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Check if a daily plan exists for a given date
  const getDailyPlanForDate = (
    date: Date,
    plans: DailyPlanSummary[]
  ): DailyPlanSummary | undefined => {
    const dateStr = date.toISOString().split("T")[0];
    return plans.find((p) => p.date === dateStr);
  };

  // Render Section 0: Source Review
  const renderSourceReviewSection = () => {
    if (!currentReview) return null;

    const weekDates = getWeekDates(currentReview.week_start_date);
    const dailyPlans = currentReview.daily_plans || [];

    return (
      <Card className="mb-6 border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
            <FileText className="h-5 w-5" />
            Section 0: Source Review (Non-negotiable)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-amber-900/80">
            Before writing anything below: Lay out all Daily Focus Cards from
            the week (or open the daily notes). Do not rely on memory. Tally
            first, reflect second.
          </p>

          {/* Daily plan links */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {weekDates.map((date) => {
              const plan = getDailyPlanForDate(date, dailyPlans);
              const isToday = date.toDateString() === new Date().toDateString();

              if (plan) {
                return (
                  <Link
                    key={date.toISOString()}
                    to={`/families/${familyId}/planner?date=${plan.date}`}
                    className={`flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-amber-100 ${
                      isToday
                        ? "border-amber-400 bg-amber-100"
                        : "border-amber-200 bg-white"
                    }`}
                  >
                    <span>{formatDayDate(date)}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                );
              }

              return (
                <div
                  key={date.toISOString()}
                  className={`flex items-center justify-center rounded-lg border border-dashed px-3 py-2 text-xs ${
                    isToday
                      ? "border-amber-300 bg-amber-50 text-amber-600"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {formatDayDate(date)}
                </div>
              );
            })}
          </div>

          {/* Checkbox */}
          <div className="flex items-center space-x-3 rounded-lg bg-white p-3">
            <Checkbox
              id="source-review-completed"
              checked={sourceReviewCompleted}
              onCheckedChange={(checked) =>
                handleSourceReviewChange(checked === true)
              }
              className="h-5 w-5"
            />
            <Label
              htmlFor="source-review-completed"
              className="cursor-pointer text-sm font-medium"
            >
              I have reviewed all my Daily Focus Cards for this week
            </Label>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render Section 1: Review (Evidence-based)
  const renderReviewSection = () => {
    if (!currentReview) return null;

    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Section 1: Review (Evidence-based)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="wins-shipped"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Trophy className="h-4 w-4 text-yellow-500" />
              Wins (things that shipped or moved forward)
            </Label>
            <Textarea
              id="wins-shipped"
              value={winsShipped}
              onChange={(e) => setWinsShipped(e.target.value)}
              onBlur={() => handleSection1Blur("wins_shipped", winsShipped)}
              placeholder="What did you ship? What moved forward? What are you proud of this week?"
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="losses-friction"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Losses / Friction
            </Label>
            <Textarea
              id="losses-friction"
              value={lossesFriction}
              onChange={(e) => setLossesFriction(e.target.value)}
              onBlur={() =>
                handleSection1Blur("losses_friction", lossesFriction)
              }
              placeholder="What didn't work? What created friction? What do you wish had gone differently?"
              className="min-h-[120px] resize-none"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calculate completion percentage helper
  const calcPercentage = (
    completed: number | null,
    planned: number | null
  ): number | null => {
    if (completed === null || planned === null || planned === 0) return null;
    return Math.round((completed / planned) * 100);
  };

  // Render Section 2: Metrics Snapshot
  const renderMetricsSnapshotSection = () => {
    if (!currentReview) return null;

    // Helper to parse number from input (empty string = null)
    const parseNumberInput = (value: string): number | null => {
      if (value === "") return null;
      const num = parseInt(value, 10);
      return isNaN(num) ? null : num;
    };

    // Metric row component for completed / planned pairs
    const MetricRow = ({
      label,
      completedValue,
      plannedValue,
      onCompletedChange,
      onPlannedChange,
      onCompletedBlur,
      onPlannedBlur,
      plannedDisabled = false,
    }: {
      label: string;
      completedValue: number | null;
      plannedValue: number | null;
      onCompletedChange: (val: number | null) => void;
      onPlannedChange: (val: number | null) => void;
      onCompletedBlur: () => void;
      onPlannedBlur: () => void;
      plannedDisabled?: boolean;
    }) => {
      const percentage = calcPercentage(completedValue, plannedValue);

      return (
        <div className="flex items-center gap-3 rounded-lg bg-white p-3">
          <div className="min-w-[140px] flex-1 text-sm font-medium">
            {label}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={completedValue ?? ""}
              onChange={(e) =>
                onCompletedChange(parseNumberInput(e.target.value))
              }
              onBlur={onCompletedBlur}
              className="w-16 text-center"
              placeholder="0"
            />
            <span className="text-muted-foreground text-sm">/</span>
            <Input
              type="number"
              min={0}
              value={plannedValue ?? ""}
              onChange={(e) =>
                onPlannedChange(parseNumberInput(e.target.value))
              }
              onBlur={onPlannedBlur}
              className="w-16 text-center"
              placeholder="0"
              disabled={plannedDisabled}
            />
          </div>
          {percentage !== null && (
            <span
              className={`min-w-[50px] text-right text-sm font-semibold ${
                percentage >= 80
                  ? "text-green-600"
                  : percentage >= 50
                    ? "text-yellow-600"
                    : "text-red-500"
              }`}
            >
              {percentage}%
            </span>
          )}
          {percentage === null && <span className="min-w-[50px]" />}
        </div>
      );
    };

    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-purple-600" />
            Section 2: Metrics Snapshot (Tally from Daily Cards)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg bg-gray-50 p-2">
            <MetricRow
              label="Workouts completed"
              completedValue={workoutsCompleted}
              plannedValue={workoutsPlanned}
              onCompletedChange={setWorkoutsCompleted}
              onPlannedChange={setWorkoutsPlanned}
              onCompletedBlur={() =>
                handleMetricsNumberBlur("workouts_completed", workoutsCompleted)
              }
              onPlannedBlur={() =>
                handleMetricsNumberBlur("workouts_planned", workoutsPlanned)
              }
            />
            <MetricRow
              label="Daily walks completed"
              completedValue={walksCompleted}
              plannedValue={walksPlanned}
              onCompletedChange={setWalksCompleted}
              onPlannedChange={setWalksPlanned}
              onCompletedBlur={() =>
                handleMetricsNumberBlur("walks_completed", walksCompleted)
              }
              onPlannedBlur={() =>
                handleMetricsNumberBlur("walks_planned", walksPlanned)
              }
            />
            <MetricRow
              label="Writing sessions"
              completedValue={writingSessionsCompleted}
              plannedValue={writingSessionsPlanned}
              onCompletedChange={setWritingSessionsCompleted}
              onPlannedChange={setWritingSessionsPlanned}
              onCompletedBlur={() =>
                handleMetricsNumberBlur(
                  "writing_sessions_completed",
                  writingSessionsCompleted
                )
              }
              onPlannedBlur={() =>
                handleMetricsNumberBlur(
                  "writing_sessions_planned",
                  writingSessionsPlanned
                )
              }
            />
            <MetricRow
              label="House resets"
              completedValue={houseResetsCompleted}
              plannedValue={houseResetsPlanned}
              onCompletedChange={setHouseResetsCompleted}
              onPlannedChange={setHouseResetsPlanned}
              onCompletedBlur={() =>
                handleMetricsNumberBlur(
                  "house_resets_completed",
                  houseResetsCompleted
                )
              }
              onPlannedBlur={() =>
                handleMetricsNumberBlur(
                  "house_resets_planned",
                  houseResetsPlanned
                )
              }
            />
          </div>

          {/* Meals prepped / system held - Y/N toggle */}
          <div className="flex items-center justify-between rounded-lg bg-white p-3">
            <Label className="text-sm font-medium">
              Meals prepped / system held
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mealsPrepHeld === true ? "default" : "outline"}
                size="sm"
                onClick={() => handleMealsPrepChange(true)}
                className={
                  mealsPrepHeld === true
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
              >
                Yes
              </Button>
              <Button
                type="button"
                variant={mealsPrepHeld === false ? "default" : "outline"}
                size="sm"
                onClick={() => handleMealsPrepChange(false)}
                className={
                  mealsPrepHeld === false ? "bg-red-500 hover:bg-red-600" : ""
                }
              >
                No
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label
              htmlFor="metrics-notes"
              className="text-sm font-medium text-gray-600"
            >
              Notes (only if something broke)
            </Label>
            <Textarea
              id="metrics-notes"
              value={metricsNotes}
              onChange={(e) => setMetricsNotes(e.target.value)}
              onBlur={handleMetricsNotesBlur}
              placeholder="What caused issues this week? Leave blank if everything went smoothly."
              className="min-h-[80px] resize-none"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render past reviews
  const renderPastReviews = () => {
    const pastReviews =
      reviewsData?.weekly_reviews.filter((r) => r.id !== currentReview?.id) ||
      [];

    if (pastReviews.length === 0) {
      return (
        <InlineEmptyState
          variant="weekly_reviews"
          title="No past reviews yet"
          description="Complete your first weekly review to see it here."
          showAction={false}
        />
      );
    }

    return (
      <div className="space-y-4">
        {pastReviews.slice(0, 8).map((review) => (
          <Card key={review.id} className="bg-white/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Week {getWeekNumber(review.week_start_date)}:{" "}
                  {formatWeekRange(review.week_start_date)}
                </span>
                {review.completed && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {review.wins.length > 0 && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    Wins
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {review.wins.slice(0, 3).map((win, idx) => (
                      <li key={idx}>{win}</li>
                    ))}
                    {review.wins.length > 3 && (
                      <li className="text-muted-foreground">
                        +{review.wins.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {review.challenges.length > 0 && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                    Challenges
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {review.challenges.slice(0, 2).map((challenge, idx) => (
                      <li key={idx}>{challenge}</li>
                    ))}
                    {review.challenges.length > 2 && (
                      <li className="text-muted-foreground">
                        +{review.challenges.length - 2} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {review.lessons_learned && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                    <Lightbulb className="h-3 w-3 text-blue-500" />
                    Lessons
                  </p>
                  <p className="mt-1 text-sm">{review.lessons_learned}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    const step = WEEKLY_REVIEW_STEPS[currentStep];

    switch (step.key) {
      case "metrics":
        return renderMetricsStep();
      case "wins":
        return renderArrayStep(
          wins,
          setWins,
          "What went well this week?",
          "Add a win...",
          "text-yellow-500"
        );
      case "challenges":
        return renderArrayStep(
          challenges,
          setChallenges,
          "What was challenging this week?",
          "Add a challenge...",
          "text-orange-500"
        );
      case "lessons":
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-center text-sm">
              Reflect on what you learned this week
            </p>
            <Textarea
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="What did you learn? What insights did you gain? What would you do differently?"
              className="min-h-[200px] resize-none"
            />
          </div>
        );
      case "priorities":
        return renderPrioritiesStep();
      default:
        return null;
    }
  };

  // Render metrics step
  const renderMetricsStep = () => {
    const metrics = currentReview?.metrics;
    const taskMetrics = metrics?.task_completion;
    const goalMetrics = metrics?.goal_progress;

    return (
      <div className="space-y-6">
        {/* Task Completion */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <ListChecks className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Task Completion</h3>
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-700">
                      {taskMetrics?.completed_tasks || 0}
                    </span>
                    <span className="text-muted-foreground">
                      / {taskMetrics?.total_tasks || 0} tasks
                    </span>
                  </div>
                  <Progress
                    value={taskMetrics?.completion_rate || 0}
                    className="mt-2 h-2"
                  />
                  <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                    <span>
                      {taskMetrics?.completion_rate || 0}% completion rate
                    </span>
                    <span>
                      {taskMetrics?.days_with_plans || 0} days planned
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Goals Progress</h3>
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-700">
                      {goalMetrics?.average_progress || 0}%
                    </span>
                    <span className="text-muted-foreground">avg. progress</span>
                  </div>
                  <Progress
                    value={goalMetrics?.average_progress || 0}
                    className="mt-2 h-2"
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>{goalMetrics?.completed_goals || 0} completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>
                        {goalMetrics?.in_progress_goals || 0} in progress
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span>{goalMetrics?.at_risk_goals || 0} at risk</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                      <span>{goalMetrics?.total_goals || 0} total goals</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-sm">
          Take a moment to review your week&apos;s progress before moving on.
        </p>
      </div>
    );
  };

  // Render array input step (wins/challenges)
  const renderArrayStep = (
    items: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    description: string,
    placeholder: string,
    iconColor: string
  ) => {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-center text-sm">
          {description}
        </p>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${iconColor} bg-opacity-10`}
              >
                {index + 1}
              </div>
              <Input
                value={item}
                onChange={(e) =>
                  handleArrayItemChange(setter, index, e.target.value)
                }
                placeholder={placeholder}
                className="flex-1"
              />
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeArrayItem(setter, index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {items.length < 10 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => addArrayItem(setter, items)}
            className="w-full"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Another
          </Button>
        )}
      </div>
    );
  };

  // Render priorities step
  const renderPrioritiesStep = () => {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-center text-sm">
          What are your top 3-5 priorities for next week?
        </p>
        <div className="space-y-2">
          {priorities.map((priority, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                {index + 1}
              </div>
              <Input
                value={priority}
                onChange={(e) =>
                  handleArrayItemChange(setPriorities, index, e.target.value)
                }
                placeholder={`Priority ${index + 1}`}
                className="flex-1"
              />
              {priorities.length > 3 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeArrayItem(setPriorities, index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {priorities.length < 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => addArrayItem(setPriorities, priorities)}
            className="w-full"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Priority
          </Button>
        )}
      </div>
    );
  };

  // Loading state
  if (loadingFamily || loadingReview || loadingReviews) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="text-muted-foreground">
          Loading your weekly review...
        </div>
      </div>
    );
  }

  // Past reviews view
  if (showPastReviews) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-4">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setShowPastReviews(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to This Week
            </Button>
            <h1 className="text-center text-2xl font-bold text-gray-900">
              Past Weekly Reviews
            </h1>
            <p className="text-muted-foreground mt-1 text-center text-sm">
              Review your journey week by week
            </p>
          </div>

          {renderPastReviews()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            {family?.name}
          </p>
          <h1 className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
            <Calendar className="h-6 w-6 text-orange-600" />
            Weekly Review
          </h1>
          <p className="text-muted-foreground mt-2">
            {currentReview
              ? `Week ${getWeekNumber(currentReview.week_start_date)}: ${formatWeekRange(currentReview.week_start_date)}`
              : "Review your week"}
          </p>
        </div>

        {/* Tip for first weekly review */}
        <StandaloneTip tipType="first_weekly_review" className="mb-4" />

        {/* Section 0: Source Review */}
        {renderSourceReviewSection()}

        {/* Section 1: Review (Evidence-based) */}
        {renderReviewSection()}

        {/* Section 2: Metrics Snapshot */}
        {renderMetricsSnapshotSection()}

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {WEEKLY_REVIEW_STEPS.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPastReviews(true)}
            >
              <History className="mr-1 h-4 w-4" />
              Past Reviews
            </Button>
          </div>
          <Progress
            value={((currentStep + 1) / WEEKLY_REVIEW_STEPS.length) * 100}
            className="h-2"
          />
        </div>

        {/* Current step card */}
        <Card className="mb-6 border-0 bg-white/80 shadow-lg backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-primary">
                {getStepIcon(WEEKLY_REVIEW_STEPS[currentStep].key)}
              </span>
              {WEEKLY_REVIEW_STEPS[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
              className={saveSuccess ? "border-green-500 text-green-600" : ""}
            >
              <Save className="mr-1 h-4 w-4" />
              {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save"}
            </Button>

            {currentStep < WEEKLY_REVIEW_STEPS.length - 1 ? (
              <Button onClick={goNext}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isSaving}>
                Complete
                <CheckCircle2 className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/families/${familyId}/planner`}>Daily Planner</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/families/${familyId}/goals`}>Goals</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
