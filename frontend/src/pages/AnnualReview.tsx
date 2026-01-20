import { useState, useCallback, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MentionInput } from "@/components/ui/mention-input";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useFamily } from "@/hooks/useFamilies";
import {
  useCurrentAnnualReview,
  useAnnualReviews,
  useUpdateAnnualReview,
} from "@/hooks/useAnnualReviews";
import {
  formatYear,
  getYearDateRange,
  ANNUAL_REVIEW_STEPS,
} from "@/lib/annualReviews";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Star,
  Mountain,
  Lightbulb,
  Heart,
  Compass,
  Target,
  Save,
  History,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  TrendingUp,
  ClipboardList,
  Flame,
  Plus,
  X,
} from "lucide-react";
import { InlineEmptyState } from "@/components/EmptyState";

export function AnnualReview() {
  const { id } = useParams<{ id: string }>();
  const familyId = parseInt(id || "0");
  const navigate = useNavigate();

  // Fetch data
  const { data: family, isLoading: loadingFamily } = useFamily(familyId);
  const { data: currentReview, isLoading: loadingReview } =
    useCurrentAnnualReview(familyId);
  const { data: reviewsData, isLoading: loadingReviews } =
    useAnnualReviews(familyId);

  // Mutations
  const updateReview = useUpdateAnnualReview(familyId);

  // Local state
  const [currentStep, setCurrentStep] = useState(0);
  const [showPastReviews, setShowPastReviews] = useState(false);
  const [yearHighlights, setYearHighlights] = useState<string[]>([""]);
  const [yearChallenges, setYearChallenges] = useState<string[]>([""]);
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [gratitude, setGratitude] = useState<string[]>(["", "", ""]);
  const [nextYearTheme, setNextYearTheme] = useState("");
  const [nextYearGoals, setNextYearGoals] = useState<string[]>(["", "", ""]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing review data
  useEffect(() => {
    if (currentReview) {
      if (currentReview.year_highlights?.length > 0) {
        setYearHighlights([...currentReview.year_highlights, ""]);
      }
      if (currentReview.year_challenges?.length > 0) {
        setYearChallenges([...currentReview.year_challenges, ""]);
      }
      if (currentReview.lessons_learned) {
        setLessonsLearned(currentReview.lessons_learned);
      }
      if (currentReview.gratitude?.length > 0) {
        const items = [...currentReview.gratitude];
        while (items.length < 3) items.push("");
        setGratitude(items);
      }
      if (currentReview.next_year_theme) {
        setNextYearTheme(currentReview.next_year_theme);
      }
      if (currentReview.next_year_goals?.length > 0) {
        const goals = [...currentReview.next_year_goals];
        while (goals.length < 3) goals.push("");
        setNextYearGoals(goals.slice(0, 5));
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
      const filteredHighlights = yearHighlights.filter((h) => h.trim());
      const filteredChallenges = yearChallenges.filter((c) => c.trim());
      const filteredGratitude = gratitude.filter((g) => g.trim());
      const filteredGoals = nextYearGoals.filter((g) => g.trim());

      await updateReview.mutateAsync({
        reviewId: currentReview.id,
        data: {
          year_highlights: filteredHighlights,
          year_challenges: filteredChallenges,
          lessons_learned: lessonsLearned.trim() || undefined,
          gratitude: filteredGratitude,
          next_year_theme: nextYearTheme.trim() || undefined,
          next_year_goals: filteredGoals,
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
    yearHighlights,
    yearChallenges,
    lessonsLearned,
    gratitude,
    nextYearTheme,
    nextYearGoals,
    updateReview,
  ]);

  // Complete and save review
  const handleComplete = useCallback(async () => {
    if (!currentReview) return;

    setIsSaving(true);
    try {
      const filteredHighlights = yearHighlights.filter((h) => h.trim());
      const filteredChallenges = yearChallenges.filter((c) => c.trim());
      const filteredGratitude = gratitude.filter((g) => g.trim());
      const filteredGoals = nextYearGoals.filter((g) => g.trim());

      await updateReview.mutateAsync({
        reviewId: currentReview.id,
        data: {
          year_highlights: filteredHighlights,
          year_challenges: filteredChallenges,
          lessons_learned: lessonsLearned.trim() || undefined,
          gratitude: filteredGratitude,
          next_year_theme: nextYearTheme.trim() || undefined,
          next_year_goals: filteredGoals,
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
    yearHighlights,
    yearChallenges,
    lessonsLearned,
    gratitude,
    nextYearTheme,
    nextYearGoals,
    updateReview,
    navigate,
    familyId,
  ]);

  // Navigate between steps
  const goNext = () => {
    if (currentStep < ANNUAL_REVIEW_STEPS.length - 1) {
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
        return <Mountain className="h-5 w-5" />;
      case "lessons":
        return <Lightbulb className="h-5 w-5" />;
      case "gratitude":
        return <Heart className="h-5 w-5" />;
      case "theme":
        return <Compass className="h-5 w-5" />;
      case "goals":
        return <Target className="h-5 w-5" />;
      default:
        return <ClipboardList className="h-5 w-5" />;
    }
  };

  // Render past reviews
  const renderPastReviews = () => {
    const pastReviews =
      reviewsData?.annual_reviews.filter((r) => r.id !== currentReview?.id) ||
      [];

    if (pastReviews.length === 0) {
      return (
        <InlineEmptyState
          variant="annual_reviews"
          title="No past reviews yet"
          description="Complete your first annual review to see it here."
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
                  {formatYear(review.year)}
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
              {review.next_year_theme && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                    <Compass className="h-3 w-3 text-indigo-500" />
                    Theme
                  </p>
                  <p className="mt-1 font-medium text-indigo-700">
                    {review.next_year_theme}
                  </p>
                </div>
              )}
              {review.year_highlights.length > 0 && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                    <Star className="h-3 w-3 text-amber-500" />
                    Highlights
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {review.year_highlights
                      .slice(0, 3)
                      .map((highlight, idx) => (
                        <li key={idx}>{highlight}</li>
                      ))}
                    {review.year_highlights.length > 3 && (
                      <li className="text-muted-foreground">
                        +{review.year_highlights.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {review.lessons_learned && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                    <Lightbulb className="h-3 w-3 text-yellow-500" />
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
    const step = ANNUAL_REVIEW_STEPS[currentStep];

    switch (step.key) {
      case "metrics":
        return renderMetricsStep();
      case "highlights":
        return renderArrayStep(
          yearHighlights,
          setYearHighlights,
          "What were your biggest highlights this year?",
          "Add a highlight...",
          "text-amber-500"
        );
      case "challenges":
        return renderArrayStep(
          yearChallenges,
          setYearChallenges,
          "What challenges did you face this year?",
          "Add a challenge...",
          "text-slate-500"
        );
      case "lessons":
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-center text-sm">
              Reflect on your key lessons from this year
            </p>
            <MentionInput
              value={lessonsLearned}
              onChange={setLessonsLearned}
              placeholder="What lessons did you learn? What would you do differently? Use @name to mention family members"
              className="min-h-[200px]"
            />
          </div>
        );
      case "gratitude":
        return renderGratitudeStep();
      case "theme":
        return renderThemeStep();
      case "goals":
        return renderGoalsStep();
      default:
        return null;
    }
  };

  // Render metrics step
  const renderMetricsStep = () => {
    const metrics = currentReview?.metrics;
    const goalsMetrics = metrics?.goals_achieved;
    const streaksMetrics = metrics?.streaks_maintained;
    const reviewMetrics = metrics?.review_consistency;

    return (
      <div className="space-y-6">
        {/* Goals Achieved */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Annual Goals Achieved</h3>
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-700">
                      {goalsMetrics?.completed_goals || 0}
                    </span>
                    <span className="text-muted-foreground">
                      / {goalsMetrics?.total_goals || 0} annual goals
                    </span>
                  </div>
                  <Progress
                    value={goalsMetrics?.completion_rate || 0}
                    className="mt-2 h-2"
                  />
                  <div className="text-muted-foreground mt-1 text-xs">
                    {goalsMetrics?.completion_rate || 0}% completion rate
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streaks Maintained */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-100 p-3">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Longest Streaks</h3>
                <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-orange-700">
                      {streaksMetrics?.daily_planning_longest || 0}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Morning Planning
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-700">
                      {streaksMetrics?.evening_reflection_longest || 0}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Evening Reflection
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-700">
                      {streaksMetrics?.weekly_review_longest || 0}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Weekly Review
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Consistency */}
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-indigo-100 p-3">
                <ClipboardList className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Review Consistency</h3>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Quarterly Reviews</span>
                    <span className="font-medium">
                      {reviewMetrics?.quarterly_reviews?.completed || 0}/
                      {reviewMetrics?.quarterly_reviews?.total || 4}
                    </span>
                  </div>
                  <Progress
                    value={
                      reviewMetrics?.quarterly_reviews?.completion_rate || 0
                    }
                    className="h-1.5"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span>Monthly Reviews</span>
                    <span className="font-medium">
                      {reviewMetrics?.monthly_reviews?.completed || 0}/
                      {reviewMetrics?.monthly_reviews?.total || 12}
                    </span>
                  </div>
                  <Progress
                    value={reviewMetrics?.monthly_reviews?.completion_rate || 0}
                    className="h-1.5"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span>Weekly Reviews</span>
                    <span className="font-medium">
                      {reviewMetrics?.weekly_reviews?.completed || 0}/
                      {reviewMetrics?.weekly_reviews?.total || 52}
                    </span>
                  </div>
                  <Progress
                    value={reviewMetrics?.weekly_reviews?.completion_rate || 0}
                    className="h-1.5"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-sm">
          Take a moment to review your year&apos;s progress before moving on.
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

  // Render gratitude step
  const renderGratitudeStep = () => {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-center text-sm">
          What are you grateful for this year?
        </p>
        <div className="space-y-2">
          {gratitude.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-medium text-rose-600">
                <Heart className="h-4 w-4" />
              </div>
              <Input
                value={item}
                onChange={(e) =>
                  handleArrayItemChange(setGratitude, index, e.target.value)
                }
                placeholder={`I&apos;m grateful for...`}
                className="flex-1"
              />
              {gratitude.length > 3 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeArrayItem(setGratitude, index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {gratitude.length < 10 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => addArrayItem(setGratitude, gratitude)}
            className="w-full"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add More
          </Button>
        )}
      </div>
    );
  };

  // Render theme step
  const renderThemeStep = () => {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground text-center text-sm">
          Choose a single word or phrase that will guide your next year
        </p>
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <MentionInput
              multiline={false}
              value={nextYearTheme}
              onChange={setNextYearTheme}
              placeholder="e.g., Growth, Balance, Adventure, Connection..."
              className="text-center text-lg font-medium"
            />
          </div>
        </div>
        <div className="mx-auto max-w-md rounded-lg bg-indigo-50 p-4">
          <p className="text-center text-sm text-indigo-700">
            <strong>Tip:</strong> Your theme is like a North Star - it helps you
            make decisions aligned with what matters most to you.
          </p>
        </div>
      </div>
    );
  };

  // Render goals step
  const renderGoalsStep = () => {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-center text-sm">
          What are your top 3-5 goals for next year?
        </p>
        <div className="space-y-2">
          {nextYearGoals.map((goal, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                {index + 1}
              </div>
              <Input
                value={goal}
                onChange={(e) =>
                  handleArrayItemChange(setNextYearGoals, index, e.target.value)
                }
                placeholder={`Goal ${index + 1}`}
                className="flex-1"
              />
              {nextYearGoals.length > 3 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeArrayItem(setNextYearGoals, index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {nextYearGoals.length < 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => addArrayItem(setNextYearGoals, nextYearGoals)}
            className="w-full"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Goal
          </Button>
        )}
      </div>
    );
  };

  // Loading state
  if (loadingFamily || loadingReview || loadingReviews) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="text-muted-foreground">
          Loading your annual review...
        </div>
      </div>
    );
  }

  // Past reviews view
  if (showPastReviews) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 p-4">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setShowPastReviews(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to This Year
            </Button>
            <h1 className="text-center text-2xl font-bold text-gray-900">
              Past Annual Reviews
            </h1>
            <p className="text-muted-foreground mt-1 text-center text-sm">
              Review your journey year by year
            </p>
          </div>

          {renderPastReviews()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            {family?.name}
          </p>
          <h1 className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Annual Review
          </h1>
          <p className="text-muted-foreground mt-2">
            {currentReview
              ? formatYear(currentReview.year)
              : "Review your year"}
          </p>
          {currentReview && (
            <p className="text-muted-foreground text-sm">
              {getYearDateRange(currentReview.year)}
            </p>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {ANNUAL_REVIEW_STEPS.length}
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
            value={((currentStep + 1) / ANNUAL_REVIEW_STEPS.length) * 100}
            className="h-2"
          />
        </div>

        {/* Current step card */}
        <Card className="mb-6 border-0 bg-white/80 shadow-lg backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-indigo-600">
                {getStepIcon(ANNUAL_REVIEW_STEPS[currentStep].key)}
              </span>
              {ANNUAL_REVIEW_STEPS[currentStep].title}
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

            {currentStep < ANNUAL_REVIEW_STEPS.length - 1 ? (
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
            <Link to={`/families/${familyId}/quarterly-review`}>
              Quarterly Review
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
