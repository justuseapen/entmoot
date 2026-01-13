import { useState, useCallback, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useFamily } from "@/hooks/useFamilies";
import {
  useCurrentQuarterlyReview,
  useQuarterlyReviews,
  useUpdateQuarterlyReview,
} from "@/hooks/useQuarterlyReviews";
import {
  formatQuarterYear,
  getQuarterDateRange,
  QUARTERLY_REVIEW_STEPS,
} from "@/lib/quarterlyReviews";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Mountain,
  Lightbulb,
  Target,
  Save,
  History,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  TrendingUp,
  ClipboardList,
  Plus,
  X,
} from "lucide-react";
import { InlineEmptyState } from "@/components/EmptyState";

export function QuarterlyReview() {
  const { id } = useParams<{ id: string }>();
  const familyId = parseInt(id || "0");
  const navigate = useNavigate();

  // Fetch data
  const { data: family, isLoading: loadingFamily } = useFamily(familyId);
  const { data: currentReview, isLoading: loadingReview } =
    useCurrentQuarterlyReview(familyId);
  const { data: reviewsData, isLoading: loadingReviews } =
    useQuarterlyReviews(familyId);

  // Mutations
  const updateReview = useUpdateQuarterlyReview(familyId);

  // Local state
  const [currentStep, setCurrentStep] = useState(0);
  const [showPastReviews, setShowPastReviews] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([""]);
  const [obstacles, setObstacles] = useState<string[]>([""]);
  const [insights, setInsights] = useState("");
  const [nextQuarterObjectives, setNextQuarterObjectives] = useState<string[]>([
    "",
    "",
    "",
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing review data
  useEffect(() => {
    if (currentReview) {
      if (currentReview.achievements?.length > 0) {
        setAchievements([...currentReview.achievements, ""]);
      }
      if (currentReview.obstacles?.length > 0) {
        setObstacles([...currentReview.obstacles, ""]);
      }
      if (currentReview.insights) {
        setInsights(currentReview.insights);
      }
      if (currentReview.next_quarter_objectives?.length > 0) {
        const objectives = [...currentReview.next_quarter_objectives];
        while (objectives.length < 3) objectives.push("");
        setNextQuarterObjectives(objectives.slice(0, 5));
      }
    }
  }, [currentReview]);

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
      const filteredAchievements = achievements.filter((a) => a.trim());
      const filteredObstacles = obstacles.filter((o) => o.trim());
      const filteredObjectives = nextQuarterObjectives.filter((o) => o.trim());

      await updateReview.mutateAsync({
        reviewId: currentReview.id,
        data: {
          achievements: filteredAchievements,
          obstacles: filteredObstacles,
          insights: insights.trim() || undefined,
          next_quarter_objectives: filteredObjectives,
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
    achievements,
    obstacles,
    insights,
    nextQuarterObjectives,
    updateReview,
  ]);

  // Complete and save review
  const handleComplete = useCallback(async () => {
    if (!currentReview) return;

    setIsSaving(true);
    try {
      const filteredAchievements = achievements.filter((a) => a.trim());
      const filteredObstacles = obstacles.filter((o) => o.trim());
      const filteredObjectives = nextQuarterObjectives.filter((o) => o.trim());

      await updateReview.mutateAsync({
        reviewId: currentReview.id,
        data: {
          achievements: filteredAchievements,
          obstacles: filteredObstacles,
          insights: insights.trim() || undefined,
          next_quarter_objectives: filteredObjectives,
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
    achievements,
    obstacles,
    insights,
    nextQuarterObjectives,
    updateReview,
    navigate,
    familyId,
  ]);

  // Navigate between steps
  const goNext = () => {
    if (currentStep < QUARTERLY_REVIEW_STEPS.length - 1) {
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
      case "achievements":
        return <Trophy className="h-5 w-5" />;
      case "obstacles":
        return <Mountain className="h-5 w-5" />;
      case "insights":
        return <Lightbulb className="h-5 w-5" />;
      case "objectives":
        return <Target className="h-5 w-5" />;
      default:
        return <ClipboardList className="h-5 w-5" />;
    }
  };

  // Render past reviews
  const renderPastReviews = () => {
    const pastReviews =
      reviewsData?.quarterly_reviews.filter(
        (r) => r.id !== currentReview?.id
      ) || [];

    if (pastReviews.length === 0) {
      return (
        <InlineEmptyState
          variant="quarterly_reviews"
          title="No past reviews yet"
          description="Complete your first quarterly review to see it here."
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
                  {formatQuarterYear(review.quarter_start_date)}
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
              {review.achievements.length > 0 && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                    <Trophy className="h-3 w-3 text-amber-500" />
                    Achievements
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {review.achievements.slice(0, 3).map((achievement, idx) => (
                      <li key={idx}>{achievement}</li>
                    ))}
                    {review.achievements.length > 3 && (
                      <li className="text-muted-foreground">
                        +{review.achievements.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {review.obstacles.length > 0 && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                    <Mountain className="h-3 w-3 text-slate-500" />
                    Obstacles
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {review.obstacles.slice(0, 2).map((obstacle, idx) => (
                      <li key={idx}>{obstacle}</li>
                    ))}
                    {review.obstacles.length > 2 && (
                      <li className="text-muted-foreground">
                        +{review.obstacles.length - 2} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {review.insights && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                    <Lightbulb className="h-3 w-3 text-yellow-500" />
                    Insights
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm">{review.insights}</p>
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
    const step = QUARTERLY_REVIEW_STEPS[currentStep];

    switch (step.key) {
      case "metrics":
        return renderMetricsStep();
      case "achievements":
        return renderArrayStep(
          achievements,
          setAchievements,
          "What did you achieve this quarter?",
          "Add an achievement...",
          "text-amber-500"
        );
      case "obstacles":
        return renderArrayStep(
          obstacles,
          setObstacles,
          "What obstacles did you face this quarter?",
          "Add an obstacle...",
          "text-slate-500"
        );
      case "insights":
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-center text-sm">
              Reflect on your key insights from this quarter
            </p>
            <Textarea
              value={insights}
              onChange={(e) => setInsights(e.target.value)}
              placeholder="What key insights did you gain? What patterns did you notice? What would you do differently?"
              className="min-h-[200px] resize-none"
            />
          </div>
        );
      case "objectives":
        return renderObjectivesStep();
      default:
        return null;
    }
  };

  // Render metrics step
  const renderMetricsStep = () => {
    const metrics = currentReview?.metrics;
    const goalMetrics = metrics?.goal_completion;
    const monthlyMetrics = metrics?.monthly_review_completion;
    const habitMetrics = metrics?.habit_consistency;

    return (
      <div className="space-y-6">
        {/* Goal Completion */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Goal Completion</h3>
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-700">
                      {goalMetrics?.completed_goals || 0}
                    </span>
                    <span className="text-muted-foreground">
                      / {goalMetrics?.total_goals || 0} quarterly goals
                    </span>
                  </div>
                  <Progress
                    value={goalMetrics?.completion_rate || 0}
                    className="mt-2 h-2"
                  />
                  <div className="text-muted-foreground mt-1 text-xs">
                    {goalMetrics?.completion_rate || 0}% completion rate
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Review Completion */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Monthly Reviews</h3>
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-purple-700">
                      {monthlyMetrics?.completed_months || 0}
                    </span>
                    <span className="text-muted-foreground">
                      / {monthlyMetrics?.total_months || 0} months
                    </span>
                  </div>
                  <Progress
                    value={monthlyMetrics?.completion_rate || 0}
                    className="mt-2 h-2"
                  />
                  <div className="text-muted-foreground mt-1 text-xs">
                    {monthlyMetrics?.completion_rate || 0}% review completion
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Review Consistency (Habit Consistency) */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-100 p-3">
                <ClipboardList className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Weekly Review Habit</h3>
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-orange-700">
                      {habitMetrics?.completed_weeks || 0}
                    </span>
                    <span className="text-muted-foreground">
                      / {habitMetrics?.total_weeks || 0} weeks
                    </span>
                  </div>
                  <Progress
                    value={habitMetrics?.consistency_rate || 0}
                    className="mt-2 h-2"
                  />
                  <div className="text-muted-foreground mt-1 text-xs">
                    {habitMetrics?.consistency_rate || 0}% consistency rate
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-sm">
          Take a moment to review your quarter&apos;s progress before moving on.
        </p>
      </div>
    );
  };

  // Render array input step (achievements/obstacles)
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

  // Render objectives step
  const renderObjectivesStep = () => {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-center text-sm">
          What are your top 3-5 objectives for next quarter?
        </p>
        <div className="space-y-2">
          {nextQuarterObjectives.map((objective, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-medium text-teal-600">
                {index + 1}
              </div>
              <Input
                value={objective}
                onChange={(e) =>
                  handleArrayItemChange(
                    setNextQuarterObjectives,
                    index,
                    e.target.value
                  )
                }
                placeholder={`Objective ${index + 1}`}
                className="flex-1"
              />
              {nextQuarterObjectives.length > 3 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() =>
                    removeArrayItem(setNextQuarterObjectives, index)
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {nextQuarterObjectives.length < 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addArrayItem(setNextQuarterObjectives, nextQuarterObjectives)
            }
            className="w-full"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Objective
          </Button>
        )}
      </div>
    );
  };

  // Loading state
  if (loadingFamily || loadingReview || loadingReviews) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-emerald-50">
        <div className="text-muted-foreground">
          Loading your quarterly review...
        </div>
      </div>
    );
  }

  // Past reviews view
  if (showPastReviews) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-emerald-50 p-4">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setShowPastReviews(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to This Quarter
            </Button>
            <h1 className="text-center text-2xl font-bold text-gray-900">
              Past Quarterly Reviews
            </h1>
            <p className="text-muted-foreground mt-1 text-center text-sm">
              Review your journey quarter by quarter
            </p>
          </div>

          {renderPastReviews()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-emerald-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            {family?.name}
          </p>
          <h1 className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
            <Calendar className="h-6 w-6 text-teal-600" />
            Quarterly Review
          </h1>
          <p className="text-muted-foreground mt-2">
            {currentReview
              ? formatQuarterYear(currentReview.quarter_start_date)
              : "Review your quarter"}
          </p>
          {currentReview && (
            <p className="text-muted-foreground text-sm">
              {getQuarterDateRange(currentReview.quarter_start_date)}
            </p>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {QUARTERLY_REVIEW_STEPS.length}
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
            value={((currentStep + 1) / QUARTERLY_REVIEW_STEPS.length) * 100}
            className="h-2"
          />
        </div>

        {/* Current step card */}
        <Card className="mb-6 border-0 bg-white/80 shadow-lg backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-teal-600">
                {getStepIcon(QUARTERLY_REVIEW_STEPS[currentStep].key)}
              </span>
              {QUARTERLY_REVIEW_STEPS[currentStep].title}
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

            {currentStep < QUARTERLY_REVIEW_STEPS.length - 1 ? (
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
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/families/${familyId}/planner`}>Daily Planner</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/families/${familyId}/weekly-review`}>
              Weekly Review
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/families/${familyId}/monthly-review`}>
              Monthly Review
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/families/${familyId}/goals`}>Goals</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
