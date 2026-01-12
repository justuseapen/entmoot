import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoalCard } from "@/components/GoalCard";
import { GoalModal } from "@/components/GoalModal";
import { GoalDetailView } from "@/components/GoalDetailView";
import { FirstGoalPrompt } from "@/components/FirstGoalPrompt";
import { useGoals, useDeleteGoal } from "@/hooks/useGoals";
import { useFamily } from "@/hooks/useFamilies";
import { useAuthStore } from "@/stores/auth";
import {
  type Goal,
  type GoalFilters,
  type TimeScale,
  type GoalStatus,
  timeScaleOptions,
  statusOptions,
} from "@/lib/goals";
import type { GoalSuggestion } from "@/lib/firstGoalPrompt";
import { TreePine, Sparkles } from "lucide-react";

export function Goals() {
  const { id } = useParams<{ id: string }>();
  const familyId = parseInt(id || "0");
  const { user } = useAuthStore();

  // Filter state
  const [filters, setFilters] = useState<GoalFilters>({});

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewingGoalId, setViewingGoalId] = useState<number | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [showAITab, setShowAITab] = useState(false);
  const [pendingSubGoal, setPendingSubGoal] = useState<{
    parentId: number;
    title: string;
    description: string | null;
  } | null>(null);

  // First goal prompt state
  const [pendingSuggestion, setPendingSuggestion] =
    useState<GoalSuggestion | null>(null);
  const [showFirstGoalAIPrompt, setShowFirstGoalAIPrompt] = useState(false);
  const [firstGoalId, setFirstGoalId] = useState<number | null>(null);

  // Fetch data
  const {
    data: family,
    isLoading: loadingFamily,
    error: familyError,
  } = useFamily(familyId);
  const {
    data: goals,
    isLoading: loadingGoals,
    error: goalsError,
  } = useGoals(familyId, filters);
  const deleteGoal = useDeleteGoal(familyId);

  // Get current user's role in the family
  const currentUserMembership = family?.members.find(
    (m) => m.user_id === user?.id
  );
  const currentUserRole = currentUserMembership?.role;
  const canManageGoals =
    currentUserRole === "admin" ||
    currentUserRole === "adult" ||
    currentUserRole === "teen";

  // Get family members for assignment
  const familyMembers = useMemo(() => {
    return (
      family?.members.map((m) => ({
        id: m.user_id,
        name: m.name,
        email: m.email,
        avatar_url: m.avatar_url || null,
      })) || []
    );
  }, [family?.members]);

  // Filter handlers
  const handleTimeScaleChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      time_scale: value === "all" ? undefined : (value as TimeScale),
    }));
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : (value as GoalStatus),
    }));
  };

  const handleAssigneeChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      assignee_id: value === "all" ? undefined : parseInt(value),
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Action handlers
  const handleGoalClick = (goal: Goal) => {
    setViewingGoalId(goal.id);
  };

  const handleEditGoal = (goal: Goal) => {
    setViewingGoalId(null);
    setShowAITab(false);
    setEditingGoal(goal);
  };

  const handleRefineWithAI = (goal: Goal) => {
    setViewingGoalId(null);
    setShowAITab(true);
    setEditingGoal(goal);
  };

  const handleDeleteGoal = (goal: Goal) => {
    setViewingGoalId(null);
    setDeletingGoal(goal);
  };

  const confirmDelete = async () => {
    if (!deletingGoal) return;
    try {
      await deleteGoal.mutateAsync(deletingGoal.id);
      setDeletingGoal(null);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const handleCreateSubGoal = (
    parentGoalId: number,
    milestone: {
      title: string;
      description: string | null;
      suggestedProgress: number;
    }
  ) => {
    // Store the sub-goal info and open a create modal for it
    setPendingSubGoal({
      parentId: parentGoalId,
      title: milestone.title,
      description: milestone.description,
    });
    // Close the current editing modal to open a new creation modal
    setEditingGoal(null);
    setShowAITab(false);
    setShowCreateModal(true);
  };

  // First goal prompt handlers
  const handleSelectSuggestion = (suggestion: GoalSuggestion) => {
    setPendingSuggestion(suggestion);
    setShowCreateModal(true);
  };

  const handleCreateOwn = () => {
    setPendingSuggestion(null);
    setShowCreateModal(true);
  };

  const handleGoalCreated = (goalId: number, isFirstGoal: boolean) => {
    if (isFirstGoal) {
      setFirstGoalId(goalId);
      setShowFirstGoalAIPrompt(true);
    }
  };

  const handleRefineFirstGoal = () => {
    setShowFirstGoalAIPrompt(false);
    if (firstGoalId && goals) {
      const goal = goals.find((g) => g.id === firstGoalId);
      if (goal) {
        setShowAITab(true);
        setEditingGoal(goal);
      }
    }
    setFirstGoalId(null);
  };

  const handleSkipFirstGoalRefinement = () => {
    setShowFirstGoalAIPrompt(false);
    setFirstGoalId(null);
  };

  const hasActiveFilters =
    filters.time_scale || filters.status || filters.assignee_id;

  if (loadingFamily || loadingGoals) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-muted-foreground">Loading goals...</div>
      </div>
    );
  }

  if (familyError || !family) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="text-destructive">Failed to load family</div>
        <Button asChild variant="outline">
          <Link to="/families">Back to Families</Link>
        </Button>
      </div>
    );
  }

  if (goalsError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="text-destructive">Failed to load goals</div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Goals</h1>
            <p className="text-muted-foreground">{family.name}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={`/families/${familyId}/goals/tree`}>
                <TreePine className="mr-2 h-4 w-4" />
                Tree View
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/families/${familyId}`}>Family Settings</Link>
            </Button>
            {canManageGoals && (
              <Button onClick={() => setShowCreateModal(true)}>
                Create Goal
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-40">
                <Select
                  value={filters.time_scale || "all"}
                  onValueChange={handleTimeScaleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Time Scale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time Scales</SelectItem>
                    {timeScaleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-40">
                <Select
                  value={filters.status || "all"}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-40">
                <Select
                  value={filters.assignee_id?.toString() || "all"}
                  onValueChange={handleAssigneeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Grid */}
        {goals && goals.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                canManage={canManageGoals && goal.creator.id === user?.id}
                onClick={handleGoalClick}
                onEdit={canManageGoals ? handleEditGoal : undefined}
                onDelete={
                  canManageGoals && goal.creator.id === user?.id
                    ? handleDeleteGoal
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "No goals match your filters"
                  : "No goals yet"}
              </p>
              {canManageGoals && !hasActiveFilters && (
                <Button onClick={() => setShowCreateModal(true)}>
                  Create Your First Goal
                </Button>
              )}
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Goal count */}
        {goals && goals.length > 0 && (
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Showing {goals.length} goal{goals.length !== 1 ? "s" : ""}
            {hasActiveFilters && " (filtered)"}
          </p>
        )}
      </div>

      {/* First Goal Prompt */}
      {canManageGoals && (
        <FirstGoalPrompt
          onSelectSuggestion={handleSelectSuggestion}
          onCreateOwn={handleCreateOwn}
        />
      )}

      {/* Create/Edit Modal */}
      <GoalModal
        familyId={familyId}
        goal={editingGoal}
        familyMembers={familyMembers}
        open={showCreateModal || !!editingGoal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setEditingGoal(null);
            setShowAITab(false);
            setPendingSubGoal(null);
            setPendingSuggestion(null);
          }
        }}
        initialTab={showAITab ? "ai" : "basic"}
        onCreateSubGoal={canManageGoals ? handleCreateSubGoal : undefined}
        onGoalCreated={handleGoalCreated}
        defaultValues={
          pendingSubGoal
            ? {
                title: pendingSubGoal.title,
                description: pendingSubGoal.description || undefined,
                parent_id: pendingSubGoal.parentId,
              }
            : pendingSuggestion
              ? {
                  title: pendingSuggestion.title,
                  description: pendingSuggestion.description,
                  time_scale: pendingSuggestion.time_scale,
                }
              : undefined
        }
      />

      {/* First Goal AI Refinement Prompt */}
      <Dialog
        open={showFirstGoalAIPrompt}
        onOpenChange={setShowFirstGoalAIPrompt}
      >
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 flex items-center gap-2 text-indigo-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <DialogTitle>Great job on your first goal!</DialogTitle>
            <DialogDescription className="pt-2">
              Would you like our AI coach to help you refine it? We can suggest
              ways to make your goal more specific, measurable, and achievable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleSkipFirstGoalRefinement}>
              Maybe later
            </Button>
            <Button
              onClick={handleRefineFirstGoal}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Refine with AI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail View Modal */}
      {viewingGoalId && (
        <GoalDetailView
          familyId={familyId}
          goalId={viewingGoalId}
          familyMembers={familyMembers}
          open={!!viewingGoalId}
          onOpenChange={(open) => {
            if (!open) setViewingGoalId(null);
          }}
          onEdit={canManageGoals ? handleEditGoal : undefined}
          onRefineWithAI={canManageGoals ? handleRefineWithAI : undefined}
          onDelete={canManageGoals ? handleDeleteGoal : undefined}
          canManage={canManageGoals}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingGoal} onOpenChange={() => setDeletingGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Goal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingGoal?.title}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingGoal(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteGoal.isPending}
            >
              {deleteGoal.isPending ? "Deleting..." : "Delete Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
