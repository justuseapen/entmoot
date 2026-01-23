import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAnnualGoals } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";
import { formatDueDate, isOverdue, isDueSoon } from "@/lib/goals";

interface AnnualGoalsSectionProps {
  familyId: number;
}

export function AnnualGoalsSection({ familyId }: AnnualGoalsSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const { data: annualGoals, isLoading } = useAnnualGoals(familyId);

  // Filter to only show active annual goals (not completed or abandoned)
  const activeAnnualGoals = annualGoals?.filter(
    (goal) => goal.status !== "completed" && goal.status !== "abandoned"
  );

  // Don't render if no annual goals
  if (!isLoading && (!activeAnnualGoals || activeAnnualGoals.length === 0)) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader
        className="cursor-pointer pb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Annual Goals</CardTitle>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-amber-600 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
        <CardDescription>Your north star goals for the year</CardDescription>
      </CardHeader>
      {expanded && (
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <div className="space-y-4">
              {activeAnnualGoals?.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-lg border border-amber-200 bg-white p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/families/${familyId}/goals/${goal.id}`}
                        className="font-medium hover:text-amber-700 hover:underline"
                      >
                        {goal.title}
                      </Link>
                      {goal.due_date && (
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            isOverdue(goal.due_date)
                              ? "font-medium text-red-600"
                              : isDueSoon(goal.due_date)
                                ? "font-medium text-amber-600"
                                : "text-muted-foreground"
                          )}
                        >
                          {isOverdue(goal.due_date)
                            ? "Overdue"
                            : `Due ${formatDueDate(goal.due_date)}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {goal.draft_children_count > 0 && (
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-100 text-amber-800"
                        >
                          {goal.draft_children_count} draft
                          {goal.draft_children_count === 1 ? "" : "s"}
                        </Badge>
                      )}
                      {goal.children_count > 0 && (
                        <span className="text-muted-foreground text-xs">
                          {goal.children_count} sub-goal
                          {goal.children_count === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {goal.aggregated_progress}%
                      </span>
                    </div>
                    <Progress
                      value={goal.aggregated_progress}
                      className="h-2"
                    />
                  </div>
                  {goal.draft_children_count > 0 && (
                    <div className="mt-3">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/families/${familyId}/goals/tree`}>
                          Review Draft Sub-Goals
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-end">
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/families/${familyId}/goals?time_scale=annual`}>
                    View All Annual Goals
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
