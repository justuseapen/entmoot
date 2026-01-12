import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateGoal,
  useUpdateGoal,
  useGoals,
  useRefineGoal,
} from "@/hooks/useGoals";
import {
  type Goal,
  type GoalUser,
  type TimeScale,
  type GoalStatus,
  type GoalVisibility,
  type GoalRefinementResponse,
  type SmartSuggestions,
  timeScaleOptions,
  statusOptions,
  visibilityOptions,
} from "@/lib/goals";
import { AIRefinementPanel } from "@/components/AIRefinementPanel";

const goalSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  specific: z.string().max(2000, "Too long").optional(),
  measurable: z.string().max(2000, "Too long").optional(),
  achievable: z.string().max(2000, "Too long").optional(),
  relevant: z.string().max(2000, "Too long").optional(),
  time_bound: z.string().max(2000, "Too long").optional(),
  time_scale: z.enum(["daily", "weekly", "monthly", "quarterly", "annual"]),
  status: z.enum([
    "not_started",
    "in_progress",
    "at_risk",
    "completed",
    "abandoned",
  ]),
  visibility: z.enum(["personal", "shared", "family"]),
  progress: z.number().min(0).max(100),
  due_date: z.string().optional(),
  parent_id: z.number().nullable().optional(),
  assignee_ids: z.array(z.number()).optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface MilestoneSubGoal {
  title: string;
  description: string | null;
  suggestedProgress: number;
}

interface GoalModalProps {
  familyId: number;
  goal?: Goal | null;
  familyMembers: GoalUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "basic" | "smart" | "ai";
  onCreateSubGoal?: (parentGoalId: number, milestone: MilestoneSubGoal) => void;
  defaultValues?: {
    title?: string;
    description?: string;
    parent_id?: number;
  };
}

const wizardSteps = [
  {
    title: "Basic Info",
    description: "What do you want to achieve?",
    fields: ["title", "description", "time_scale"],
  },
  {
    title: "Specific",
    description: "What exactly will you accomplish?",
    fields: ["specific"],
  },
  {
    title: "Measurable",
    description: "How will you measure progress?",
    fields: ["measurable"],
  },
  {
    title: "Achievable",
    description: "Is this goal realistic?",
    fields: ["achievable"],
  },
  {
    title: "Relevant",
    description: "Why does this goal matter?",
    fields: ["relevant"],
  },
  {
    title: "Time-Bound",
    description: "When will you achieve this?",
    fields: ["time_bound", "due_date"],
  },
  {
    title: "Settings",
    description: "Final details",
    fields: ["visibility", "status", "progress", "parent_id", "assignee_ids"],
  },
];

export function GoalModal({
  familyId,
  goal,
  familyMembers,
  open,
  onOpenChange,
  initialTab = "basic",
  onCreateSubGoal,
  defaultValues,
}: GoalModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"single" | "wizard">("single");
  const [wizardStep, setWizardStep] = useState(0);
  const [refinement, setRefinement] = useState<GoalRefinementResponse | null>(
    null
  );
  const [showRefinement, setShowRefinement] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const isEditing = !!goal;

  const createGoal = useCreateGoal(familyId);
  const updateGoal = useUpdateGoal(familyId, goal?.id ?? 0);
  const refineGoal = useRefineGoal(familyId, goal?.id ?? 0);

  // Fetch all goals for parent selection
  const { data: allGoals } = useGoals(familyId);
  const parentGoalOptions = (allGoals || []).filter(
    (g) => g.id !== goal?.id && g.time_scale !== "daily"
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      description: "",
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      time_bound: "",
      time_scale: "weekly",
      status: "not_started",
      visibility: "family",
      progress: 0,
      due_date: "",
      parent_id: null,
      assignee_ids: [],
    },
  });

  const selectedTimeScale = watch("time_scale");
  const selectedStatus = watch("status");
  const selectedVisibility = watch("visibility");
  const selectedProgress = watch("progress");
  const selectedAssignees = watch("assignee_ids") || [];

  // Reset form when modal opens/closes or goal changes
  useEffect(() => {
    if (open) {
      setError(null);
      setWizardStep(0);
      setRefinement(null);
      setShowRefinement(false);
      setActiveTab(initialTab);
      if (goal) {
        reset({
          title: goal.title,
          description: goal.description || "",
          specific: goal.specific || "",
          measurable: goal.measurable || "",
          achievable: goal.achievable || "",
          relevant: goal.relevant || "",
          time_bound: goal.time_bound || "",
          time_scale: goal.time_scale,
          status: goal.status,
          visibility: goal.visibility,
          progress: goal.progress,
          due_date: goal.due_date || "",
          parent_id: goal.parent_id,
          assignee_ids: goal.assignees.map((a) => a.id),
        });
      } else {
        reset({
          title: defaultValues?.title || "",
          description: defaultValues?.description || "",
          specific: "",
          measurable: "",
          achievable: "",
          relevant: "",
          time_bound: "",
          time_scale: "weekly",
          status: "not_started",
          visibility: "family",
          progress: 0,
          due_date: "",
          parent_id: defaultValues?.parent_id ?? null,
          assignee_ids: [],
        });
      }
    }
  }, [open, goal, reset, initialTab, defaultValues]);

  // Handle AI refinement
  const handleRefineWithAI = async () => {
    if (!goal?.id) return;
    setError(null);
    try {
      const result = await refineGoal.mutateAsync();
      setRefinement(result.refinement);
      setShowRefinement(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get AI suggestions"
      );
    }
  };

  const handleAcceptSmartSuggestion = (
    field: keyof SmartSuggestions,
    value: string
  ) => {
    setValue(field, value);
  };

  const handleAcceptTitle = (title: string) => {
    setValue("title", title);
  };

  const handleAcceptDescription = (description: string) => {
    setValue("description", description);
  };

  const handleDismissRefinement = () => {
    setShowRefinement(false);
  };

  const handleCreateSubGoalFromMilestone = (milestone: MilestoneSubGoal) => {
    if (onCreateSubGoal && goal?.id) {
      onCreateSubGoal(goal.id, milestone);
    }
  };

  const onSubmit = async (data: GoalFormData) => {
    setError(null);
    try {
      const goalData = {
        title: data.title,
        description: data.description || undefined,
        specific: data.specific || undefined,
        measurable: data.measurable || undefined,
        achievable: data.achievable || undefined,
        relevant: data.relevant || undefined,
        time_bound: data.time_bound || undefined,
        time_scale: data.time_scale as TimeScale,
        status: data.status as GoalStatus,
        visibility: data.visibility as GoalVisibility,
        progress: data.progress,
        due_date: data.due_date || undefined,
        parent_id: data.parent_id || undefined,
        assignee_ids: data.assignee_ids,
      };

      if (isEditing) {
        await updateGoal.mutateAsync(goalData);
      } else {
        await createGoal.mutateAsync(goalData);
      }
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditing ? "update" : "create"} goal`
      );
    }
  };

  const handleAssigneeToggle = (userId: number) => {
    const current = selectedAssignees;
    if (current.includes(userId)) {
      setValue(
        "assignee_ids",
        current.filter((id) => id !== userId)
      );
    } else {
      setValue("assignee_ids", [...current, userId]);
    }
  };

  const renderFormFields = () => (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="What do you want to achieve?"
          {...register("title")}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="text-destructive text-sm">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your goal in more detail..."
          {...register("description")}
          rows={3}
        />
        {errors.description && (
          <p className="text-destructive text-sm">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Time Scale & Status Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Time Scale *</Label>
          <Select
            value={selectedTimeScale}
            onValueChange={(value) =>
              setValue("time_scale", value as TimeScale)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time scale" />
            </SelectTrigger>
            <SelectContent>
              {timeScaleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => setValue("status", value as GoalStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Visibility & Due Date Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select
            value={selectedVisibility}
            onValueChange={(value) =>
              setValue("visibility", value as GoalVisibility)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              {visibilityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {
              visibilityOptions.find((v) => v.value === selectedVisibility)
                ?.description
            }
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input id="due_date" type="date" {...register("due_date")} />
        </div>
      </div>

      {/* Progress Slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Progress</Label>
          <span className="text-sm font-medium">{selectedProgress}%</span>
        </div>
        <Slider
          value={[selectedProgress]}
          onValueChange={(values) => setValue("progress", values[0])}
          max={100}
          step={5}
        />
      </div>

      {/* Parent Goal */}
      <div className="space-y-2">
        <Label>Link to Parent Goal</Label>
        <Select
          value={watch("parent_id")?.toString() || "none"}
          onValueChange={(value) =>
            setValue("parent_id", value === "none" ? null : parseInt(value))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select parent goal (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No parent goal</SelectItem>
            {parentGoalOptions.map((g) => (
              <SelectItem key={g.id} value={g.id.toString()}>
                {g.title} ({g.time_scale})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Link this goal to a higher-level goal to show hierarchy
        </p>
      </div>

      {/* Assignees */}
      <div className="space-y-2">
        <Label>Assign to Family Members</Label>
        <div className="flex flex-wrap gap-2">
          {familyMembers.map((member) => (
            <Button
              key={member.id}
              type="button"
              variant={
                selectedAssignees.includes(member.id) ? "default" : "outline"
              }
              size="sm"
              onClick={() => handleAssigneeToggle(member.id)}
            >
              {member.name}
            </Button>
          ))}
        </div>
        {familyMembers.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No family members to assign
          </p>
        )}
      </div>
    </div>
  );

  const renderSmartFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="specific">Specific</Label>
        <Textarea
          id="specific"
          placeholder="What exactly will you accomplish? Be detailed and clear."
          {...register("specific")}
          rows={2}
        />
        <p className="text-muted-foreground text-xs">
          A specific goal answers: What, Who, Where, When, Why
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="measurable">Measurable</Label>
        <Textarea
          id="measurable"
          placeholder="How will you track progress? What metrics will you use?"
          {...register("measurable")}
          rows={2}
        />
        <p className="text-muted-foreground text-xs">
          Include numbers, quantities, or specific outcomes you can measure
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="achievable">Achievable</Label>
        <Textarea
          id="achievable"
          placeholder="Is this goal realistic? What resources do you need?"
          {...register("achievable")}
          rows={2}
        />
        <p className="text-muted-foreground text-xs">
          Consider your current abilities, time, and resources
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="relevant">Relevant</Label>
        <Textarea
          id="relevant"
          placeholder="Why does this goal matter? How does it align with your bigger picture?"
          {...register("relevant")}
          rows={2}
        />
        <p className="text-muted-foreground text-xs">
          Connect this goal to your values and long-term objectives
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="time_bound">Time-Bound</Label>
        <Textarea
          id="time_bound"
          placeholder="When will you achieve this? What are your milestones?"
          {...register("time_bound")}
          rows={2}
        />
        <p className="text-muted-foreground text-xs">
          Set specific deadlines and checkpoints
        </p>
      </div>
    </div>
  );

  const renderWizardStep = () => {
    const step = wizardSteps[wizardStep];
    return (
      <div className="space-y-4 py-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">{step.title}</h3>
          <p className="text-muted-foreground text-sm">{step.description}</p>
        </div>

        {wizardStep === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title *</Label>
              <Input
                id="title"
                placeholder="What do you want to achieve?"
                {...register("title")}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-destructive text-sm">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your goal..."
                {...register("description")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Time Scale *</Label>
              <Select
                value={selectedTimeScale}
                onValueChange={(value) =>
                  setValue("time_scale", value as TimeScale)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time scale" />
                </SelectTrigger>
                <SelectContent>
                  {timeScaleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {wizardStep === 1 && (
          <div className="space-y-2">
            <Label htmlFor="specific">Specific</Label>
            <Textarea
              id="specific"
              placeholder="What exactly will you accomplish? Be detailed and clear about what, who, where, when, and why."
              {...register("specific")}
              rows={4}
            />
          </div>
        )}

        {wizardStep === 2 && (
          <div className="space-y-2">
            <Label htmlFor="measurable">Measurable</Label>
            <Textarea
              id="measurable"
              placeholder="How will you track progress? What metrics or outcomes will you use to know you've succeeded?"
              {...register("measurable")}
              rows={4}
            />
          </div>
        )}

        {wizardStep === 3 && (
          <div className="space-y-2">
            <Label htmlFor="achievable">Achievable</Label>
            <Textarea
              id="achievable"
              placeholder="Is this goal realistic? What resources, skills, or support do you need? What potential obstacles might you face?"
              {...register("achievable")}
              rows={4}
            />
          </div>
        )}

        {wizardStep === 4 && (
          <div className="space-y-2">
            <Label htmlFor="relevant">Relevant</Label>
            <Textarea
              id="relevant"
              placeholder="Why does this goal matter to you? How does it align with your values and long-term objectives?"
              {...register("relevant")}
              rows={4}
            />
          </div>
        )}

        {wizardStep === 5 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="time_bound">Time-Bound</Label>
              <Textarea
                id="time_bound"
                placeholder="When will you achieve this? What milestones will you set along the way?"
                {...register("time_bound")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" type="date" {...register("due_date")} />
            </div>
          </div>
        )}

        {wizardStep === 6 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={selectedVisibility}
                  onValueChange={(value) =>
                    setValue("visibility", value as GoalVisibility)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {visibilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) =>
                    setValue("status", value as GoalStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Progress</Label>
                <span className="text-sm font-medium">{selectedProgress}%</span>
              </div>
              <Slider
                value={[selectedProgress]}
                onValueChange={(values) => setValue("progress", values[0])}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Link to Parent Goal</Label>
              <Select
                value={watch("parent_id")?.toString() || "none"}
                onValueChange={(value) =>
                  setValue(
                    "parent_id",
                    value === "none" ? null : parseInt(value)
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent goal</SelectItem>
                  {parentGoalOptions.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.title} ({g.time_scale})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign to Family Members</Label>
              <div className="flex flex-wrap gap-2">
                {familyMembers.map((member) => (
                  <Button
                    key={member.id}
                    type="button"
                    variant={
                      selectedAssignees.includes(member.id)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleAssigneeToggle(member.id)}
                  >
                    {member.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Goal" : "Create New Goal"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your goal details and SMART criteria."
              : "Set a clear, achievable goal using the SMART framework."}
          </DialogDescription>
        </DialogHeader>

        {!isEditing && (
          <div className="flex items-center justify-center gap-4 py-2">
            <Button
              type="button"
              variant={mode === "single" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("single")}
            >
              Quick Form
            </Button>
            <Button
              type="button"
              variant={mode === "wizard" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMode("wizard");
                setWizardStep(0);
              }}
            >
              SMART Wizard
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          {mode === "single" || isEditing ? (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "basic" | "smart" | "ai")}
              className="py-4"
            >
              <TabsList
                className={`grid w-full ${isEditing ? "grid-cols-3" : "grid-cols-2"}`}
              >
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="smart">SMART Details</TabsTrigger>
                {isEditing && <TabsTrigger value="ai">AI Coach</TabsTrigger>}
              </TabsList>
              <TabsContent value="basic" className="mt-4">
                {renderFormFields()}
              </TabsContent>
              <TabsContent value="smart" className="mt-4">
                {renderSmartFields()}
              </TabsContent>
              {isEditing && (
                <TabsContent value="ai" className="mt-4">
                  {showRefinement && refinement ? (
                    <AIRefinementPanel
                      refinement={refinement}
                      currentValues={{
                        title: watch("title"),
                        description: watch("description") || "",
                        specific: watch("specific") || "",
                        measurable: watch("measurable") || "",
                        achievable: watch("achievable") || "",
                        relevant: watch("relevant") || "",
                        time_bound: watch("time_bound") || "",
                      }}
                      onAcceptSmartSuggestion={handleAcceptSmartSuggestion}
                      onAcceptTitle={handleAcceptTitle}
                      onAcceptDescription={handleAcceptDescription}
                      onDismiss={handleDismissRefinement}
                      onCreateSubGoal={
                        onCreateSubGoal
                          ? handleCreateSubGoalFromMilestone
                          : undefined
                      }
                    />
                  ) : (
                    <div className="space-y-4 py-4 text-center">
                      <div className="text-6xl">✨</div>
                      <h3 className="text-lg font-semibold">
                        Refine Your Goal with AI
                      </h3>
                      <p className="text-muted-foreground mx-auto max-w-md text-sm">
                        Get personalized suggestions from our AI coach to make
                        your goal more specific, measurable, achievable,
                        relevant, and time-bound.
                      </p>
                      <Button
                        type="button"
                        onClick={handleRefineWithAI}
                        disabled={refineGoal.isPending}
                        className="mt-4"
                      >
                        {refineGoal.isPending ? (
                          <>
                            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Analyzing goal...
                          </>
                        ) : (
                          "Get AI Suggestions"
                        )}
                      </Button>
                      {refineGoal.isError && (
                        <p className="text-destructive text-sm">
                          {refineGoal.error instanceof Error
                            ? refineGoal.error.message
                            : "Failed to get suggestions. Please try again."}
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <>
              {/* Progress indicator */}
              <div className="flex justify-center gap-2 py-2">
                {wizardSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-8 rounded-full transition-colors ${
                      index <= wizardStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              {renderWizardStep()}
            </>
          )}

          <DialogFooter className="gap-2">
            {mode === "wizard" && !isEditing && wizardStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setWizardStep((prev) => prev - 1)}
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {mode === "wizard" &&
            !isEditing &&
            wizardStep < wizardSteps.length - 1 ? (
              <Button
                type="button"
                onClick={() => setWizardStep((prev) => prev + 1)}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Goal"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
