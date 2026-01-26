import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  useUpdateGoal,
  useGoal,
  useSubGoals,
  useRegenerateSubGoals,
  goalKeys,
} from "@/hooks/useGoals";
import { useQueryClient } from "@tanstack/react-query";
import {
  updateGoal as updateGoalApi,
  type Goal as GoalType,
} from "@/lib/goals";
import {
  type Goal,
  type GoalUser,
  type GoalStatus,
  formatDueDate,
  getStatusLabel,
  getTimeScaleLabel,
  statusOptions,
  isDueSoon,
  isOverdue,
} from "@/lib/goals";

interface GoalDetailViewProps {
  familyId: number;
  goalId: number;
  // familyMembers available for future assignee editing feature
  familyMembers?: GoalUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (goal: Goal) => void;
  onRefineWithAI?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  canManage: boolean;
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "in_progress":
      return "secondary";
    case "at_risk":
    case "abandoned":
      return "destructive";
    default:
      return "outline";
  }
}

function getTimeScaleBadgeColor(timeScale: string): string {
  switch (timeScale) {
    case "daily":
      return "bg-purple-100 text-purple-800";
    case "weekly":
      return "bg-blue-100 text-blue-800";
    case "monthly":
      return "bg-green-100 text-green-800";
    case "quarterly":
      return "bg-yellow-100 text-yellow-800";
    case "annual":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function GoalDetailView({
  familyId,
  goalId,
  open,
  onOpenChange,
  onEdit,
  onRefineWithAI,
  onDelete,
  canManage,
}: GoalDetailViewProps) {
  const queryClient = useQueryClient();
  const { data: goal, isLoading, error } = useGoal(familyId, goalId);
  const { data: subGoals, isLoading: isLoadingSubGoals } = useSubGoals(
    familyId,
    goalId
  );
  const updateGoal = useUpdateGoal(familyId, goalId);
  const regenerateSubGoals = useRegenerateSubGoals(familyId, goalId);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updatingSubGoalId, setUpdatingSubGoalId] = useState<number | null>(
    null
  );

  const canRegenerateSubGoals =
    goal && ["annual", "quarterly"].includes(goal.time_scale);

  const handleRegenerateSubGoals = async () => {
    try {
      const result = await regenerateSubGoals.mutateAsync();
      toast.success(result.message);
    } catch {
      toast.error("Failed to start sub-goal generation. Please try again.");
    }
  };

  if (!open) return null;

  const handleStatusChange = async (newStatus: GoalStatus) => {
    if (!goal) return;
    setIsUpdatingStatus(true);
    try {
      await updateGoal.mutateAsync({ status: newStatus });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSubGoalToggle = async (subGoal: GoalType) => {
    setUpdatingSubGoalId(subGoal.id);
    try {
      const newStatus =
        subGoal.status === "completed" ? "not_started" : "completed";
      await updateGoalApi(familyId, subGoal.id, { status: newStatus });
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: goalKeys.detail(familyId, goalId),
      });
      toast.success(
        newStatus === "completed"
          ? "Sub-goal completed!"
          : "Sub-goal marked incomplete"
      );
    } catch {
      toast.error("Failed to update sub-goal");
    } finally {
      setUpdatingSubGoalId(null);
    }
  };

  // Filter to show only non-draft, non-abandoned sub-goals
  const activeSubGoals = subGoals?.filter(
    (sg) => !sg.is_draft && sg.status !== "abandoned"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading goal...</div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-4">
            Failed to load goal details
          </div>
        )}

        {goal && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl">{goal.title}</DialogTitle>
                  {goal.description && (
                    <DialogDescription className="mt-2">
                      {goal.description}
                    </DialogDescription>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Badge
                    className={`${getTimeScaleBadgeColor(goal.time_scale)}`}
                    variant="outline"
                  >
                    {getTimeScaleLabel(goal.time_scale)}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(goal.status)}>
                    {getStatusLabel(goal.status)}
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Progress Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Progress</CardTitle>
                  {goal.children_count > 0 && (
                    <CardDescription>
                      Based on {goal.children_count} sub-goal
                      {goal.children_count !== 1 ? "s" : ""} completion
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Progress
                      value={goal.aggregated_progress}
                      className="h-3 flex-1"
                    />
                    <span className="w-12 text-right font-medium">
                      {goal.aggregated_progress}%
                    </span>
                  </div>
                  {goal.children_count === 0 && (
                    <p className="text-muted-foreground text-sm">
                      {goal.status === "completed"
                        ? "Goal marked as completed"
                        : "Create sub-goals to track progress, or mark the goal as completed when done."}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Sub-Goals Section */}
              {(goal.children_count > 0 || isLoadingSubGoals) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Sub-Goals</CardTitle>
                    <CardDescription>
                      Check off sub-goals to track your progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSubGoals ? (
                      <div className="text-muted-foreground py-4 text-center text-sm">
                        Loading sub-goals...
                      </div>
                    ) : activeSubGoals && activeSubGoals.length > 0 ? (
                      <div className="space-y-3">
                        {activeSubGoals.map((subGoal) => (
                          <div
                            key={subGoal.id}
                            className="flex items-start gap-3 rounded-lg border p-3"
                          >
                            <Checkbox
                              id={`subgoal-${subGoal.id}`}
                              checked={subGoal.status === "completed"}
                              disabled={
                                !canManage || updatingSubGoalId === subGoal.id
                              }
                              onCheckedChange={() =>
                                handleSubGoalToggle(subGoal)
                              }
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <label
                                htmlFor={`subgoal-${subGoal.id}`}
                                className={`cursor-pointer font-medium ${
                                  subGoal.status === "completed"
                                    ? "text-muted-foreground line-through"
                                    : ""
                                }`}
                              >
                                {subGoal.title}
                              </label>
                              {subGoal.description && (
                                <p
                                  className={`mt-1 text-sm ${
                                    subGoal.status === "completed"
                                      ? "text-muted-foreground/60"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {subGoal.description}
                                </p>
                              )}
                              {subGoal.due_date && (
                                <p
                                  className={`mt-1 text-xs ${
                                    isOverdue(subGoal.due_date) &&
                                    subGoal.status !== "completed"
                                      ? "text-destructive"
                                      : isDueSoon(subGoal.due_date) &&
                                          subGoal.status !== "completed"
                                        ? "text-yellow-600"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  Due: {formatDueDate(subGoal.due_date)}
                                </p>
                              )}
                            </div>
                            {updatingSubGoalId === subGoal.id && (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground py-4 text-center text-sm">
                        No active sub-goals found
                      </p>
                    )}
                    {goal.draft_children_count > 0 && (
                      <p className="text-muted-foreground mt-3 text-sm">
                        {goal.draft_children_count} draft sub-goal
                        {goal.draft_children_count !== 1 ? "s" : ""} pending
                        review
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Status Update */}
              {canManage && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Update Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={goal.status}
                      onValueChange={(value) =>
                        handleStatusChange(value as GoalStatus)
                      }
                      disabled={isUpdatingStatus}
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
                  </CardContent>
                </Card>
              )}

              {/* Due Date & Visibility */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Due Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {goal.due_date ? (
                      <span
                        className={`font-medium ${
                          isOverdue(goal.due_date)
                            ? "text-destructive"
                            : isDueSoon(goal.due_date)
                              ? "text-yellow-600"
                              : ""
                        }`}
                      >
                        {formatDueDate(goal.due_date)}
                        {isOverdue(goal.due_date) && " (Overdue)"}
                        {isDueSoon(goal.due_date) &&
                          !isOverdue(goal.due_date) &&
                          " (Soon)"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Visibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="capitalize">{goal.visibility}</span>
                  </CardContent>
                </Card>
              </div>

              {/* Creator & Assignees */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">People</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm">
                      Created by
                    </p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {goal.creator.avatar_url && (
                          <AvatarImage
                            src={goal.creator.avatar_url}
                            alt={goal.creator.name}
                          />
                        )}
                        <AvatarFallback>
                          {goal.creator.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{goal.creator.name}</span>
                    </div>
                  </div>

                  {goal.assignees.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-muted-foreground mb-2 text-sm">
                          Assigned to
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {goal.assignees.map((assignee) => (
                            <div
                              key={assignee.id}
                              className="flex items-center gap-2 rounded-full bg-gray-100 py-1 pr-3 pl-1"
                            >
                              <Avatar className="h-6 w-6">
                                {assignee.avatar_url && (
                                  <AvatarImage
                                    src={assignee.avatar_url}
                                    alt={assignee.name}
                                  />
                                )}
                                <AvatarFallback className="text-xs">
                                  {assignee.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{assignee.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* SMART Details */}
              {(goal.specific ||
                goal.measurable ||
                goal.achievable ||
                goal.relevant ||
                goal.time_bound) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">SMART Details</CardTitle>
                    <CardDescription>
                      Breaking down your goal with the SMART framework
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {goal.specific && (
                      <div>
                        <p className="text-sm font-medium text-blue-600">
                          Specific
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {goal.specific}
                        </p>
                      </div>
                    )}
                    {goal.measurable && (
                      <div>
                        <p className="text-sm font-medium text-green-600">
                          Measurable
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {goal.measurable}
                        </p>
                      </div>
                    )}
                    {goal.achievable && (
                      <div>
                        <p className="text-sm font-medium text-yellow-600">
                          Achievable
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {goal.achievable}
                        </p>
                      </div>
                    )}
                    {goal.relevant && (
                      <div>
                        <p className="text-sm font-medium text-purple-600">
                          Relevant
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {goal.relevant}
                        </p>
                      </div>
                    )}
                    {goal.time_bound && (
                      <div>
                        <p className="text-sm font-medium text-red-600">
                          Time-Bound
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {goal.time_bound}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Trackability Section */}
              {goal.trackability_assessed_at && goal.trackable && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        Auto-Tracking Available
                      </CardTitle>
                      <Badge className="bg-emerald-100 text-emerald-800">
                        Trackable
                      </Badge>
                    </div>
                    <CardDescription>
                      This goal&apos;s progress can be automatically measured
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {goal.trackability_assessment?.reason && (
                      <p className="text-muted-foreground text-sm">
                        {goal.trackability_assessment.reason}
                      </p>
                    )}
                    {goal.trackability_assessment?.potential_integrations &&
                      goal.trackability_assessment.potential_integrations
                        .length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-medium">
                            Potential Integrations:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {goal.trackability_assessment.potential_integrations.map(
                              (integration) => (
                                <Badge key={integration} variant="secondary">
                                  {integration}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <div className="text-muted-foreground text-xs">
                <p>
                  Created:{" "}
                  {new Date(goal.created_at).toLocaleDateString(undefined, {
                    dateStyle: "long",
                  })}
                </p>
                <p>
                  Last updated:{" "}
                  {new Date(goal.updated_at).toLocaleDateString(undefined, {
                    dateStyle: "long",
                  })}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              {canManage && canRegenerateSubGoals && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleRegenerateSubGoals}
                  disabled={regenerateSubGoals.isPending}
                >
                  {regenerateSubGoals.isPending ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>🎯</span>
                      {goal.children_count > 0
                        ? "Regenerate Sub-Goals"
                        : "Generate Sub-Goals"}
                    </>
                  )}
                </Button>
              )}
              {canManage && onRefineWithAI && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => onRefineWithAI(goal)}
                >
                  <span>✨</span>
                  Refine with AI
                </Button>
              )}
              {canManage && onEdit && (
                <Button variant="outline" onClick={() => onEdit(goal)}>
                  Edit Goal
                </Button>
              )}
              {canManage && onDelete && (
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => onDelete(goal)}
                >
                  Delete
                </Button>
              )}
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
