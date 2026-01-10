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
import { Progress } from "@/components/ui/progress";
import {
  type Goal,
  formatDueDate,
  getStatusLabel,
  getTimeScaleLabel,
  isDueSoon,
  isOverdue,
} from "@/lib/goals";

interface GoalCardProps {
  goal: Goal;
  canManage: boolean;
  onClick?: (goal: Goal) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
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

export function GoalCard({
  goal,
  canManage,
  onClick,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const formattedDueDate = formatDueDate(goal.due_date);
  const dueSoon = isDueSoon(goal.due_date);
  const overdue = isOverdue(goal.due_date);

  return (
    <Card
      className={`flex cursor-pointer flex-col transition-shadow hover:shadow-md ${onClick ? "cursor-pointer" : ""}`}
      onClick={() => onClick?.(goal)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-lg">{goal.title}</CardTitle>
            {goal.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {goal.description}
              </CardDescription>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <Badge
              className={`${getTimeScaleBadgeColor(goal.time_scale)} text-xs`}
              variant="outline"
            >
              {getTimeScaleLabel(goal.time_scale)}
            </Badge>
            <Badge variant={getStatusBadgeVariant(goal.status)}>
              {getStatusLabel(goal.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1 space-y-3">
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>

          {/* Due date */}
          {formattedDueDate && (
            <div className="text-sm">
              <span className="text-muted-foreground">Due: </span>
              <span
                className={`font-medium ${
                  overdue
                    ? "text-destructive"
                    : dueSoon
                      ? "text-yellow-600"
                      : ""
                }`}
              >
                {formattedDueDate}
                {overdue && " (Overdue)"}
                {dueSoon && !overdue && " (Soon)"}
              </span>
            </div>
          )}

          {/* Assignees */}
          {goal.assignees.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Assignees:</span>
              <div className="flex -space-x-2">
                {goal.assignees.slice(0, 3).map((assignee) => (
                  <Avatar
                    key={assignee.id}
                    className="border-background h-6 w-6 border-2"
                    title={assignee.name}
                  >
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
                ))}
                {goal.assignees.length > 3 && (
                  <div className="border-background bg-muted flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs">
                    +{goal.assignees.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {canManage && (onEdit || onDelete) && (
          <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(goal)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground flex-1"
                onClick={() => onDelete(goal)}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
