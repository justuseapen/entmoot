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
import { GoalTreeNode } from "@/components/GoalTreeNode";
import { GoalDetailView } from "@/components/GoalDetailView";
import { useGoals } from "@/hooks/useGoals";
import { useFamily } from "@/hooks/useFamilies";
import { useAuthStore } from "@/stores/auth";
import { type Goal, type TimeScale, timeScaleOptions } from "@/lib/goals";
import { TreePine, List, Target } from "lucide-react";

// Time scale order from highest to lowest
const TIME_SCALE_ORDER: TimeScale[] = [
  "annual",
  "quarterly",
  "monthly",
  "weekly",
  "daily",
];

export function GoalTree() {
  const { id } = useParams<{ id: string }>();
  const familyId = parseInt(id || "0");
  const { user } = useAuthStore();

  // Filter state
  const [selectedMember, setSelectedMember] = useState<string>("all");

  // Modal state
  const [viewingGoalId, setViewingGoalId] = useState<number | null>(null);

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
  } = useGoals(familyId);

  // Get current user's role
  const currentUserMembership = family?.members.find(
    (m) => m.user_id === user?.id
  );
  const currentUserRole = currentUserMembership?.role;
  const canManageGoals =
    currentUserRole === "admin" ||
    currentUserRole === "adult" ||
    currentUserRole === "teen";

  // Family members for filter
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

  // Filter goals by selected member
  const filteredGoals = useMemo(() => {
    if (!goals) return [];
    if (selectedMember === "all") return goals;
    const memberId = parseInt(selectedMember);
    return goals.filter(
      (goal) =>
        goal.creator.id === memberId ||
        goal.assignees.some((a) => a.id === memberId)
    );
  }, [goals, selectedMember]);

  // Build tree structure - get root goals (no parent) organized by time scale
  const rootGoals = useMemo(() => {
    if (!filteredGoals) return [];
    return filteredGoals
      .filter((goal) => !goal.parent_id)
      .sort((a, b) => {
        // Sort by time scale (annual first) then by title
        const aIndex = TIME_SCALE_ORDER.indexOf(a.time_scale);
        const bIndex = TIME_SCALE_ORDER.indexOf(b.time_scale);
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.title.localeCompare(b.title);
      });
  }, [filteredGoals]);

  // Get child goals for a parent
  const getChildGoals = (parentId: number): Goal[] => {
    if (!filteredGoals) return [];
    return filteredGoals
      .filter((goal) => goal.parent_id === parentId)
      .sort((a, b) => {
        const aIndex = TIME_SCALE_ORDER.indexOf(a.time_scale);
        const bIndex = TIME_SCALE_ORDER.indexOf(b.time_scale);
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.title.localeCompare(b.title);
      });
  };

  // Check if any goals have parent-child relationships
  const hasLinkedGoals = useMemo(() => {
    if (!filteredGoals) return false;
    return filteredGoals.some((goal) => goal.parent_id !== null);
  }, [filteredGoals]);

  // Handle goal click to open detail view
  const handleGoalClick = (goal: Goal) => {
    setViewingGoalId(goal.id);
  };

  if (loadingFamily || loadingGoals) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-muted-foreground">Loading goal hierarchy...</div>
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TreePine className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold">Goal Hierarchy</h1>
              <p className="text-muted-foreground">{family.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={`/families/${familyId}/goals`}>
                <List className="mr-2 h-4 w-4" />
                List View
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/families/${familyId}`}>Family Settings</Link>
            </Button>
          </div>
        </div>

        {/* Filter by Family Member */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter by Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-48">
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
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
          </CardContent>
        </Card>

        {/* Time Scale Legend */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-muted-foreground text-sm font-medium">
                Time Scale Colors:
              </span>
              {timeScaleOptions.map((option) => (
                <div key={option.value} className="flex items-center gap-1.5">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      option.value === "annual"
                        ? "bg-red-300"
                        : option.value === "quarterly"
                          ? "bg-yellow-300"
                          : option.value === "monthly"
                            ? "bg-green-300"
                            : option.value === "weekly"
                              ? "bg-blue-300"
                              : "bg-purple-300"
                    }`}
                  />
                  <span className="text-sm">{option.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goal Tree */}
        {filteredGoals && filteredGoals.length > 0 ? (
          <div className="space-y-4">
            {/* Show guidance if goals exist but none are linked */}
            {!hasLinkedGoals && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Target className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">
                        No linked goals found
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Your goals are not connected in a hierarchy yet. To see
                        the bigger picture, link your daily and weekly goals to
                        monthly, quarterly, or annual goals. You can set a
                        parent goal when creating or editing any goal.
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-3"
                      >
                        <Link to={`/families/${familyId}/goals`}>
                          Go to Goals to Link Them
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tree nodes */}
            <div className="space-y-4">
              {rootGoals.map((goal) => (
                <GoalTreeNode
                  key={goal.id}
                  goal={goal}
                  childGoals={getChildGoals(goal.id)}
                  allGoals={filteredGoals}
                  level={0}
                  onGoalClick={handleGoalClick}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TreePine className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-2 text-lg font-medium">
                No goals to display
              </p>
              <p className="text-muted-foreground mb-4 text-center text-sm">
                {selectedMember !== "all"
                  ? "This member has no goals yet."
                  : "Create your first goal to start building your hierarchy."}
              </p>
              <div className="flex gap-2">
                {selectedMember !== "all" && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMember("all")}
                  >
                    Show All Members
                  </Button>
                )}
                <Button asChild>
                  <Link to={`/families/${familyId}/goals`}>Go to Goals</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {filteredGoals && filteredGoals.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {TIME_SCALE_ORDER.map((timeScale) => {
              const count = filteredGoals.filter(
                (g) => g.time_scale === timeScale
              ).length;
              return (
                <Card key={timeScale}>
                  <CardContent className="py-3 text-center">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-muted-foreground text-sm capitalize">
                      {timeScale}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

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
          canManage={canManageGoals}
        />
      )}
    </div>
  );
}
