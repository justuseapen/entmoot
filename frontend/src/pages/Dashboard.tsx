import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/auth";
import { useFamilyStore } from "@/stores/family";
import { useFamilies } from "@/hooks/useFamilies";
import { useTodaysPlan } from "@/hooks/useDailyPlans";
import { useGoals } from "@/hooks/useGoals";
import { useNotifications } from "@/hooks/useNotifications";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { formatTodayDate } from "@/lib/dailyPlans";
import {
  isDueSoon,
  isOverdue,
  formatDueDate,
  getStatusColor,
} from "@/lib/goals";
import {
  getActivityIcon,
  getActivityColor,
  formatActivityTime,
} from "@/lib/activityFeed";
import { FamilyCreationWizard } from "@/components/FamilyCreationWizard";
import { StreaksSummary } from "@/components/StreaksSummary";
import { BadgeShowcase } from "@/components/BadgeShowcase";
import { PointsDisplay } from "@/components/PointsDisplay";
import { FirstReflectionPrompt } from "@/components/FirstReflectionPrompt";

// Get time-based greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function Dashboard() {
  const { user } = useAuthStore();
  const { currentFamily } = useFamilyStore();
  const { data: families, isLoading: familiesLoading } = useFamilies();

  // Fetch today's plan if family is selected
  const { data: todaysPlan, isLoading: planLoading } = useTodaysPlan(
    currentFamily?.id ?? 0
  );

  // Fetch upcoming goals (due within 7 days, not completed)
  const { data: goals, isLoading: goalsLoading } = useGoals(
    currentFamily?.id ?? 0
  );

  // Fetch notifications
  const { data: notifications } = useNotifications();

  // Fetch activity feed
  const { data: activities, isLoading: activitiesLoading } = useActivityFeed(
    currentFamily?.id ?? 0,
    5
  );

  const showCreationWizard =
    !familiesLoading && (!families || families.length === 0);

  // Filter goals that are due soon or overdue
  const upcomingGoals = goals
    ?.filter(
      (goal) =>
        goal.status !== "completed" &&
        goal.status !== "abandoned" &&
        goal.due_date &&
        (isDueSoon(goal.due_date) || isOverdue(goal.due_date))
    )
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 5);

  // Unread notifications for pending reminders
  const unreadNotifications =
    notifications?.notifications.filter((n) => !n.read) ?? [];

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {getGreeting()}, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground text-sm">{formatTodayDate()}</p>
        </div>

        {showCreationWizard ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {user?.name}!</CardTitle>
                <CardDescription>
                  Let&apos;s get started by creating your first family.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A family is your shared planning space. You can invite family
                  members to collaborate on goals, daily planning, and more.
                </p>
              </CardContent>
            </Card>
            <div className="flex justify-center">
              <FamilyCreationWizard />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks to help you stay organized
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {currentFamily ? (
                    <>
                      <Button
                        asChild
                        variant="default"
                        className="justify-start"
                      >
                        <Link to={`/families/${currentFamily.id}/planner`}>
                          Start Daily Planning
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="justify-start"
                      >
                        <Link to={`/families/${currentFamily.id}/reflection`}>
                          Evening Reflection
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="justify-start"
                      >
                        <Link
                          to={`/families/${currentFamily.id}/weekly-review`}
                        >
                          Weekly Review
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="justify-start"
                      >
                        <Link to={`/families/${currentFamily.id}/goals`}>
                          View Goals
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        disabled
                        className="justify-start"
                      >
                        Start Daily Planning
                      </Button>
                      <Button
                        variant="outline"
                        disabled
                        className="justify-start"
                      >
                        Evening Reflection
                      </Button>
                      <Button
                        variant="outline"
                        disabled
                        className="justify-start"
                      >
                        Weekly Review
                      </Button>
                      <Button
                        variant="outline"
                        disabled
                        className="justify-start"
                      >
                        View Goals
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Today's Plan & Upcoming Goals */}
              <div className="space-y-6 lg:col-span-2">
                {/* Today's Daily Plan */}
                {currentFamily && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Today&apos;s Plan
                        </CardTitle>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/families/${currentFamily.id}/planner`}>
                            Open Planner
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {planLoading ? (
                        <p className="text-muted-foreground text-sm">
                          Loading...
                        </p>
                      ) : todaysPlan ? (
                        <div className="space-y-4">
                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Tasks completed
                              </span>
                              <span className="font-medium">
                                {todaysPlan.completion_stats.completed} /{" "}
                                {todaysPlan.completion_stats.total}
                              </span>
                            </div>
                            <Progress
                              value={todaysPlan.completion_stats.percentage}
                            />
                          </div>

                          {/* Top Priorities */}
                          {todaysPlan.top_priorities.length > 0 && (
                            <div>
                              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                                Top Priorities
                              </p>
                              <ul className="space-y-1">
                                {todaysPlan.top_priorities
                                  .filter((p) => p.title)
                                  .slice(0, 3)
                                  .map((priority, index) => (
                                    <li
                                      key={priority.id || index}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                                        {index + 1}
                                      </span>
                                      {priority.title}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                          {/* Intention */}
                          {todaysPlan.intention && (
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                                Today&apos;s Intention
                              </p>
                              <p className="text-sm italic">
                                &ldquo;{todaysPlan.intention}&rdquo;
                              </p>
                            </div>
                          )}

                          {/* Empty state */}
                          {todaysPlan.top_priorities.filter((p) => p.title)
                            .length === 0 &&
                            !todaysPlan.intention &&
                            todaysPlan.completion_stats.total === 0 && (
                              <p className="text-muted-foreground text-sm">
                                No plan set for today yet.{" "}
                                <Link
                                  to={`/families/${currentFamily.id}/planner`}
                                  className="text-blue-600 hover:underline"
                                >
                                  Start planning
                                </Link>
                              </p>
                            )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No plan available.{" "}
                          <Link
                            to={`/families/${currentFamily.id}/planner`}
                            className="text-blue-600 hover:underline"
                          >
                            Create one
                          </Link>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming Goals */}
                {currentFamily && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Upcoming Goals
                        </CardTitle>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/families/${currentFamily.id}/goals`}>
                            View All
                          </Link>
                        </Button>
                      </div>
                      <CardDescription>
                        Goals due within the next 7 days
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {goalsLoading ? (
                        <p className="text-muted-foreground text-sm">
                          Loading...
                        </p>
                      ) : upcomingGoals && upcomingGoals.length > 0 ? (
                        <ul className="space-y-3">
                          {upcomingGoals.map((goal) => (
                            <li
                              key={goal.id}
                              className="flex items-start justify-between gap-4 rounded-lg border p-3"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {goal.title}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-white ${getStatusColor(goal.status)}`}
                                  >
                                    {goal.status.replace("_", " ")}
                                  </span>
                                  {goal.due_date && (
                                    <span
                                      className={
                                        isOverdue(goal.due_date)
                                          ? "font-medium text-red-600"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      {isOverdue(goal.due_date)
                                        ? "Overdue"
                                        : `Due ${formatDueDate(goal.due_date)}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <span className="text-muted-foreground">
                                  {goal.progress}%
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No goals due soon. Keep up the great work!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Recent Family Activity */}
                {currentFamily && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        Recent Family Activity
                      </CardTitle>
                      <CardDescription>
                        What your family has been up to
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {activitiesLoading ? (
                        <p className="text-muted-foreground text-sm">
                          Loading...
                        </p>
                      ) : activities && activities.length > 0 ? (
                        <ul className="space-y-3">
                          {activities.map((activity, index) => (
                            <li
                              key={`${activity.type}-${activity.timestamp}-${index}`}
                              className="flex items-start gap-3"
                            >
                              <span className="text-lg">
                                {getActivityIcon(activity.type)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm">
                                  <span className="font-medium">
                                    {activity.user.name}
                                  </span>{" "}
                                  <span
                                    className={getActivityColor(activity.type)}
                                  >
                                    {activity.description}
                                  </span>
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {formatActivityTime(activity.timestamp)}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No recent activity. Start planning and tracking goals
                          to see activity here!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Gamification & Reminders */}
              <div className="space-y-6">
                {/* Streaks */}
                <StreaksSummary />

                {/* Points */}
                <PointsDisplay compact />

                {/* Badges */}
                <BadgeShowcase compact />

                {/* Pending Reminders/Notifications */}
                {unreadNotifications.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Pending Reminders
                        </CardTitle>
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/notifications">View All</Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {unreadNotifications.slice(0, 3).map((notification) => (
                          <li
                            key={notification.id}
                            className="rounded-lg border border-blue-200 bg-blue-50 p-3"
                          >
                            <p className="text-sm font-medium">
                              {notification.title}
                            </p>
                            {notification.body && (
                              <p className="text-muted-foreground mt-1 text-xs">
                                {notification.body}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                      {unreadNotifications.length > 3 && (
                        <p className="text-muted-foreground mt-2 text-center text-xs">
                          +{unreadNotifications.length - 3} more
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Navigation Links */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {currentFamily && (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Link to={`/families/${currentFamily.id}`}>
                            Family Settings
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Link
                            to={`/families/${currentFamily.id}/leaderboard`}
                          >
                            Family Leaderboard
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Link to={`/families/${currentFamily.id}/goals/tree`}>
                            Goal Tree View
                          </Link>
                        </Button>
                      </>
                    )}
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Link to="/families">Manage Families</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Link to="/settings/notifications">
                        Notification Settings
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Select Family Prompt */}
            {!currentFamily && families && families.length > 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Select a family from the switcher in the header to see your
                    dashboard.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* First Reflection Prompt - shown on first login */}
      {currentFamily && <FirstReflectionPrompt familyId={currentFamily.id} />}
    </div>
  );
}
