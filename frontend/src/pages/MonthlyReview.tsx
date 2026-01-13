import { useState, useCallback, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useFamily } from "@/hooks/useFamilies";
import {
  useCurrentMonthlyReview,
  useMonthlyReviews,
  useUpdateMonthlyReview,
} from "@/hooks/useMonthlyReviews";
import { formatMonthYear, MONTHLY_REVIEW_STEPS } from "@/lib/monthlyReviews";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Star,
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
  BookOpen,
} from "lucide-react";
import { InlineEmptyState } from "@/components/EmptyState";

export function MonthlyReview() {
  const { id } = useParams<{ id: string }>();
  const familyId = parseInt(id || "0");
  const navigate = useNavigate();

  // Fetch data
  const { data: family, isLoading: loadingFamily } = useFamily(familyId);
  const { data: currentReview, isLoading: loadingReview } =
    useCurrentMonthlyReview(familyId);
  const { data: reviewsData, isLoading: loadingReviews } =
    useMonthlyReviews(familyId);

  // Mutations
  const updateReview = useUpdateMonthlyReview(familyId);

  // Local state
  const [currentStep, setCurrentStep] = useState(0);
  const [showPastReviews, setShowPastReviews] = useState(false);
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [challenges, setChallenges] = useState<string[]>([""]);
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [nextMonthFocus, setNextMonthFocus] = useState<string[]>(["", "", ""]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing review data
  useEffect(() => {
    if (currentReview) {
      if (currentReview.highlights?.length > 0) {
        setHighlights([...currentReview.highlights, ""]);
      }
      if (currentReview.challenges?.length > 0) {
        setChallenges([...currentReview.challenges, ""]);
      }
      if (currentReview.lessons_learned) {
        setLessonsLearned(currentReview.lessons_learned);
      }
      if (currentReview.next_month_focus?.length > 0) {
        const focus = [...currentReview.next_month_focus];
        while (focus.length < 3) focus.push("");
        setNextMonthFocus(focus.slice(0, 5));
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
      const filteredHighlights = highlights.filter((h) => h.trim());
      const filteredChallenges = challenges.filter((c) => c.trim());
      const filteredFocus = nextMonthFocus.filter((f) => f.trim());

      await updateReview.mutateAsync({
        reviewId: currentReview.id,
        data: {
          highlights: filteredHighlights,
          challenges: filteredChallenges,
          lessons_learned: lessonsLearned.trim() || undefined,
          next_month_focus: filteredFocus,
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
    highlights,
    challenges,
    lessonsLearned,
    nextMonthFocus,
    updateReview,
  ]);

  // Complete and save review
  const handleComplete = useCallback(async () => {
    if (!currentReview) return;

    setIsSaving(true);
    try {
      const filteredHighlights = highlights.filter((h) => h.trim());
      const filteredChallenges = challenges.filter((c) => c.trim());
      const filteredFocus = nextMonthFocus.filter((f) => f.trim());

      await updateReview.mutateAsync({
        reviewId: currentReview.id,
        data: {
          highlights: filteredHighlights,
          challenges: filteredChallenges,
          lessons_learned: lessonsLearned.trim() || undefined,
          next_month_focus: filteredFocus,
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
    highlights,
    challenges,
    lessonsLearned,
    nextMonthFocus,
    updateReview,
    navigate,
    familyId,
  ]);

  // Navigate between steps
  const goNext = () => {
    if (currentStep < MONTHLY_REVIEW_STEPS.length - 1) {
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
      case "highlights":
        return <Star className="h-5 w-5" />;
      case "challenges":
        return <AlertTriangle className="h-5 w-5" />;
      case "lessons":
        return <Lightbulb className="h-5 w-5" />;
      case "focus":
        return <Target className="h-5 w-5" />;
      default:
        return <ListChecks className="h-5 w-5" />;
    }
  };

  // Render past reviews
  const renderPastReviews = () => {
    const pastReviews =
      reviewsData?.monthly_reviews.filter((r) => r.id !== currentReview?.id) ||
      [];

    if (pastReviews.length === 0) {
      return (
        <InlineEmptyState
          variant="monthly_reviews"
          title="No past reviews yet"
          description="Complete your first monthly review to see it here."
          showAction={false}
        />
      );
    }

    return (
      <div className="space-y-4">
        {pastReviews.slice(0, 12).map((review) => (
          <Card key={review.id} className="bg-white/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatMonthYear(review.month)}
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
              {review.highlights.length > 0 && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                    <Star className="h-3 w-3 text-yellow-500" />
                    Highlights
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {review.highlights.slice(0, 3).map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                    {review.highlights.length > 3 && (
                      <li className="text-muted-foreground">
                        +{review.highlights.length - 3} more
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
                  <p className="mt-1 line-clamp-2 text-sm">
                    {review.lessons_learned}
                  </p>
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
    const step = MONTHLY_REVIEW_STEPS[currentStep];

    switch (step.key) {
      case "metrics":
        return renderMetricsStep();
      case "highlights":
        return renderArrayStep(
          highlights,
          setHighlights,
          "What were the highlights of this month?",
          "Add a highlight...",
          "text-yellow-500"
        );
      case "challenges":
        return renderArrayStep(
          challenges,
          setChallenges,
          "What challenges did you face this month?",
          "Add a challenge...",
          "text-orange-500"
        );
      case "lessons":
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-center text-sm">
              Reflect on what you learned this month
            </p>
            <Textarea
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="What did you learn? What insights did you gain? What would you do differently?"
              className="min-h-[200px] resize-none"
            />
          </div>
        );
      case "focus":
        return renderFocusStep();
      default:
        return null;
    }
  };

  // Render metrics step
  const renderMetricsStep = () => {
    const metrics = currentReview?.metrics;
    const taskMetrics = metrics?.task_completion;
    const goalMetrics = metrics?.goal_progress;
    const reflectionMetrics = metrics?.reflection_consistency;

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
                  <div className="text-muted-foreground mt-1 text-xs">
                    {taskMetrics?.completion_rate || 0}% completion rate
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
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                      <span>{goalMetrics?.total_goals || 0} total goals</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reflection Consistency */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Reflection Consistency</h3>
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-purple-700">
                      {reflectionMetrics?.total_reflections || 0}
                    </span>
                    <span className="text-muted-foreground">
                      / {reflectionMetrics?.days_in_month || 0} days
                    </span>
                  </div>
                  <Progress
                    value={reflectionMetrics?.consistency_rate || 0}
                    className="mt-2 h-2"
                  />
                  <div className="text-muted-foreground mt-1 text-xs">
                    {reflectionMetrics?.consistency_rate || 0}% consistency rate
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-sm">
          Take a moment to review your month&apos;s progress before moving on.
        </p>
      </div>
    );
  };

  // Render array input step (highlights/challenges)
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

  // Render focus step
  const renderFocusStep = () => {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-center text-sm">
          What are your top 3-5 focus areas for next month?
        </p>
        <div className="space-y-2">
          {nextMonthFocus.map((focus, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                {index + 1}
              </div>
              <Input
                value={focus}
                onChange={(e) =>
                  handleArrayItemChange(
                    setNextMonthFocus,
                    index,
                    e.target.value
                  )
                }
                placeholder={`Focus area ${index + 1}`}
                className="flex-1"
              />
              {nextMonthFocus.length > 3 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeArrayItem(setNextMonthFocus, index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {nextMonthFocus.length < 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => addArrayItem(setNextMonthFocus, nextMonthFocus)}
            className="w-full"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Focus Area
          </Button>
        )}
      </div>
    );
  };

  // Loading state
  if (loadingFamily || loadingReview || loadingReviews) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-50 to-indigo-50">
        <div className="text-muted-foreground">
          Loading your monthly review...
        </div>
      </div>
    );
  }

  // Past reviews view
  if (showPastReviews) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50 p-4">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setShowPastReviews(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to This Month
            </Button>
            <h1 className="text-center text-2xl font-bold text-gray-900">
              Past Monthly Reviews
            </h1>
            <p className="text-muted-foreground mt-1 text-center text-sm">
              Review your journey month by month
            </p>
          </div>

          {renderPastReviews()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            {family?.name}
          </p>
          <h1 className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
            <Calendar className="h-6 w-6 text-purple-600" />
            Monthly Review
          </h1>
          <p className="text-muted-foreground mt-2">
            {currentReview
              ? formatMonthYear(currentReview.month)
              : "Review your month"}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {MONTHLY_REVIEW_STEPS.length}
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
            value={((currentStep + 1) / MONTHLY_REVIEW_STEPS.length) * 100}
            className="h-2"
          />
        </div>

        {/* Current step card */}
        <Card className="mb-6 border-0 bg-white/80 shadow-lg backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-purple-600">
                {getStepIcon(MONTHLY_REVIEW_STEPS[currentStep].key)}
              </span>
              {MONTHLY_REVIEW_STEPS[currentStep].title}
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

            {currentStep < MONTHLY_REVIEW_STEPS.length - 1 ? (
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
            <Link to={`/families/${familyId}/goals`}>Goals</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
