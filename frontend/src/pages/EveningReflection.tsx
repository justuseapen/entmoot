import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useTodaysPlan } from "@/hooks/useDailyPlans";
import { useFamily } from "@/hooks/useFamilies";
import { useCelebration } from "@/components/CelebrationToast";
import {
  useReflections,
  useReflectionPrompts,
  useCreateReflection,
  useUpdateReflection,
} from "@/hooks/useReflections";
import {
  type Mood,
  type ReflectionPrompt,
  type ReflectionResponseAttributes,
  MOOD_CONFIG,
  MOODS,
  ENERGY_LABELS,
  formatReflectionDate,
} from "@/lib/reflections";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sparkles,
  Heart,
  Battery,
  Save,
  History,
  ArrowLeft,
} from "lucide-react";
import { StandaloneTip } from "@/components/TipTooltip";

// Step interface
interface Step {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  prompt?: ReflectionPrompt;
}

export function EveningReflection() {
  const { id } = useParams<{ id: string }>();
  const familyId = parseInt(id || "0");
  const navigate = useNavigate();
  const { celebrateFirstAction } = useCelebration();

  // Fetch data
  const { data: plan, isLoading: loadingPlan } = useTodaysPlan(familyId);
  const { data: family, isLoading: loadingFamily } = useFamily(familyId);
  const { data: promptsData, isLoading: loadingPrompts } =
    useReflectionPrompts("evening");
  const { data: reflectionsData, isLoading: loadingReflections } =
    useReflections(familyId, { type: "evening" });

  // Mutations
  const createReflection = useCreateReflection(familyId);
  const updateReflection = useUpdateReflection(familyId);

  // Local state
  const [currentStep, setCurrentStep] = useState(0);
  const [showPastReflections, setShowPastReflections] = useState(false);
  const [mood, setMood] = useState<Mood | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [gratitudeItems, setGratitudeItems] = useState<string[]>(["", "", ""]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [existingReflectionId, setExistingReflectionId] = useState<
    number | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Get prompts from the API data
  const prompts = useMemo<ReflectionPrompt[]>(() => {
    if (!promptsData?.prompts) return [];
    if (Array.isArray(promptsData.prompts)) {
      return promptsData.prompts;
    }
    return [];
  }, [promptsData]);

  // Build steps based on prompts
  const steps: Step[] = useMemo(() => {
    const baseSteps: Step[] = [
      {
        key: "summary",
        title: "Today's Summary",
        description: "Review what you accomplished today",
        icon: <CheckCircle2 className="h-5 w-5" />,
      },
    ];

    // Add prompts as steps
    prompts.forEach((prompt) => {
      if (prompt.key === "went_well") {
        baseSteps.push({
          key: prompt.key,
          title: prompt.prompt,
          description: prompt.description,
          icon: <Sparkles className="h-5 w-5" />,
          prompt,
        });
      } else if (prompt.key === "challenging") {
        baseSteps.push({
          key: prompt.key,
          title: prompt.prompt,
          description: prompt.description,
          icon: <Moon className="h-5 w-5" />,
          prompt,
        });
      } else if (prompt.key === "learned") {
        // Skip "learned" - we use gratitude instead per acceptance criteria
      } else if (prompt.key === "tomorrow") {
        baseSteps.push({
          key: prompt.key,
          title: prompt.prompt,
          description: prompt.description,
          icon: <CheckCircle2 className="h-5 w-5" />,
          prompt,
        });
      }
    });

    // Add gratitude step
    baseSteps.push({
      key: "gratitude",
      title: "What am I grateful for?",
      description: "3 things that brought you joy today",
      icon: <Heart className="h-5 w-5" />,
    });

    // Add mood and energy step
    baseSteps.push({
      key: "mood_energy",
      title: "How are you feeling?",
      description: "Optional: Rate your mood and energy (optional)",
      icon: <Battery className="h-5 w-5" />,
    });

    return baseSteps;
  }, [prompts]);

  // Check for existing today's reflection and load data
  useEffect(() => {
    if (reflectionsData?.reflections && plan) {
      const todayReflection = reflectionsData.reflections.find(
        (r) => r.daily_plan_id === plan.id && r.reflection_type === "evening"
      );

      if (todayReflection) {
        setExistingReflectionId(todayReflection.id);
        if (todayReflection.mood) setMood(todayReflection.mood);
        if (todayReflection.energy_level)
          setEnergyLevel(todayReflection.energy_level);
        if (todayReflection.gratitude_items?.length) {
          const items = [...todayReflection.gratitude_items];
          while (items.length < 3) items.push("");
          setGratitudeItems(items.slice(0, 3));
        }

        // Load responses
        const loadedResponses: Record<string, string> = {};
        todayReflection.reflection_responses.forEach((resp) => {
          loadedResponses[resp.prompt] = resp.response;
        });
        setResponses(loadedResponses);
      }
    }
  }, [reflectionsData, plan]);

  // Calculate task completion stats
  const completionStats = plan?.completion_stats || {
    total: 0,
    completed: 0,
    percentage: 0,
  };

  // Handle response change
  const handleResponseChange = (promptKey: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [promptKey]: value,
    }));
  };

  // Handle gratitude item change
  const handleGratitudeChange = (index: number, value: string) => {
    const newItems = [...gratitudeItems];
    newItems[index] = value;
    setGratitudeItems(newItems);
  };

  // Save reflection
  const handleSave = useCallback(async () => {
    if (!plan) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Build reflection responses
      const reflectionResponses: ReflectionResponseAttributes[] = [];
      prompts.forEach((prompt) => {
        const response = responses[prompt.prompt];
        if (response && response.trim()) {
          reflectionResponses.push({
            prompt: prompt.prompt,
            response: response.trim(),
          });
        }
      });

      // Filter gratitude items
      const filteredGratitude = gratitudeItems.filter((item) => item.trim());

      if (existingReflectionId) {
        // Update existing reflection
        const result = await updateReflection.mutateAsync({
          reflectionId: existingReflectionId,
          data: {
            mood: mood || undefined,
            energy_level: energyLevel || undefined,
            gratitude_items: filteredGratitude,
            reflection_responses_attributes: reflectionResponses,
          },
        });
        if (result.is_first_action) {
          celebrateFirstAction("first_reflection");
        }
      } else {
        // Create new reflection
        const result = await createReflection.mutateAsync({
          data: {
            reflection_type: "evening",
            mood: mood || undefined,
            energy_level: energyLevel || undefined,
            gratitude_items: filteredGratitude,
            reflection_responses_attributes: reflectionResponses,
          },
          dailyPlanId: plan.id,
        });
        setExistingReflectionId(result.reflection.id);
        if (result.is_first_action) {
          celebrateFirstAction("first_reflection");
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save reflection:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    plan,
    prompts,
    responses,
    gratitudeItems,
    mood,
    energyLevel,
    existingReflectionId,
    createReflection,
    updateReflection,
    celebrateFirstAction,
  ]);

  // Navigate between steps
  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render past reflections
  const renderPastReflections = () => {
    const pastReflections =
      reflectionsData?.reflections.filter(
        (r) => r.daily_plan_id !== plan?.id && r.reflection_type === "evening"
      ) || [];

    if (pastReflections.length === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No past reflections yet.</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Complete your first evening reflection to see it here.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {pastReflections.slice(0, 7).map((reflection) => (
          <Card key={reflection.id} className="bg-white/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{formatReflectionDate(reflection.date)}</span>
                <div className="flex items-center gap-2">
                  {reflection.mood && (
                    <span className="text-lg">
                      {MOOD_CONFIG[reflection.mood].emoji}
                    </span>
                  )}
                  {reflection.energy_level && (
                    <span className="text-muted-foreground text-sm">
                      Energy: {reflection.energy_level}/5
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reflection.reflection_responses.map((resp, idx) => (
                <div key={idx}>
                  <p className="text-muted-foreground text-sm font-medium">
                    {resp.prompt}
                  </p>
                  <p className="text-sm">{resp.response}</p>
                </div>
              ))}
              {reflection.gratitude_items.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Gratitude
                  </p>
                  <ul className="list-inside list-disc text-sm">
                    {reflection.gratitude_items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
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
    const step = steps[currentStep];

    switch (step.key) {
      case "summary":
        return (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-700">
                    {completionStats.completed}/{completionStats.total}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    tasks completed
                  </p>
                  <Progress
                    value={completionStats.percentage}
                    className="mt-4 h-2"
                  />
                  <p className="mt-2 text-green-700">
                    {completionStats.percentage}% of your day
                  </p>
                </div>
              </CardContent>
            </Card>

            {plan?.daily_tasks && plan.daily_tasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-muted-foreground text-sm font-medium">
                  Completed Tasks
                </h3>
                <ul className="space-y-1">
                  {plan.daily_tasks
                    .filter((t) => t.completed)
                    .map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>{task.title}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        );

      case "gratitude":
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-center text-sm">
              List three things you&apos;re grateful for today
            </p>
            {gratitudeItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-medium text-pink-600">
                  {index + 1}
                </span>
                <Input
                  value={item}
                  onChange={(e) => handleGratitudeChange(index, e.target.value)}
                  placeholder={`Gratitude ${index + 1}`}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        );

      case "mood_energy":
        return (
          <div className="space-y-8">
            {/* Mood selector */}
            <div className="space-y-4">
              <h3 className="text-center font-medium">
                How was your overall mood today?
              </h3>
              <div className="flex justify-center gap-4">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(mood === m ? null : m)}
                    className={`flex flex-col items-center gap-1 rounded-lg p-3 transition-all ${
                      mood === m
                        ? "bg-primary/10 ring-primary ring-2"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-2xl">{MOOD_CONFIG[m].emoji}</span>
                    <span className="text-xs">{MOOD_CONFIG[m].label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy level slider */}
            <div className="space-y-4">
              <h3 className="text-center font-medium">
                How was your energy level?
              </h3>
              <div className="px-4">
                <Slider
                  value={energyLevel ? [energyLevel] : [3]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={(value) => setEnergyLevel(value[0])}
                />
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Very Low</span>
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Very High</span>
                </div>
              </div>
              <p className="text-muted-foreground text-center text-sm">
                {energyLevel ? ENERGY_LABELS[energyLevel] : "Medium"}
              </p>
            </div>
          </div>
        );

      default:
        // Prompt-based steps
        if (step.prompt) {
          return (
            <div className="space-y-4">
              <p className="text-muted-foreground text-center text-sm">
                {step.description}
              </p>
              <Textarea
                value={responses[step.prompt.prompt] || ""}
                onChange={(e) =>
                  handleResponseChange(step.prompt!.prompt, e.target.value)
                }
                placeholder="Write your thoughts..."
                className="min-h-[150px] resize-none"
              />
            </div>
          );
        }
        return null;
    }
  };

  // Loading state
  if (loadingPlan || loadingFamily || loadingPrompts || loadingReflections) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="text-muted-foreground">
          Loading your evening reflection...
        </div>
      </div>
    );
  }

  // Past reflections view
  if (showPastReflections) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 p-4">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setShowPastReflections(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Today
            </Button>
            <h1 className="text-center text-2xl font-bold text-gray-900">
              Past Reflections
            </h1>
            <p className="text-muted-foreground mt-1 text-center text-sm">
              Review your journey
            </p>
          </div>

          {renderPastReflections()}
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
            <Moon className="h-6 w-6 text-indigo-600" />
            Evening Reflection
          </h1>
          <p className="text-muted-foreground mt-2">
            Take a moment to reflect on your day
          </p>
        </div>

        {/* Tip for first reflection */}
        <StandaloneTip tipType="first_reflection" className="mb-4" />

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPastReflections(true)}
            >
              <History className="mr-1 h-4 w-4" />
              Past Reflections
            </Button>
          </div>
          <Progress
            value={((currentStep + 1) / steps.length) * 100}
            className="h-2"
          />
        </div>

        {/* Current step card */}
        <Card className="mb-6 border-0 bg-white/80 shadow-lg backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-primary">{steps[currentStep].icon}</span>
              {steps[currentStep].title}
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

            {currentStep < steps.length - 1 ? (
              <Button onClick={goNext}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  await handleSave();
                  navigate(`/families/${familyId}/planner`);
                }}
                disabled={isSaving}
              >
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
        </div>
      </div>
    </div>
  );
}
