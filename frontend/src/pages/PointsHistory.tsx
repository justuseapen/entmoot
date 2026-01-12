import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePointsHistory } from "@/hooks/usePoints";
import {
  getActivityEmoji,
  formatPoints,
  formatActivityTime,
  POINT_VALUES,
  type ActivityType,
} from "@/lib/points";

export function PointsHistory() {
  const { data, isLoading, error } = usePointsHistory(100);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="mx-auto max-w-2xl">
          <p className="text-muted-foreground">Loading points history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Failed to load points history"}
              </p>
              <Button asChild className="mt-4">
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const points = data?.points;
  const recentActivity = data?.recent_activity || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Points</h1>
              <p className="text-muted-foreground">
                Your activity and points history
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Points Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {points?.total || 0}
              </p>
              <p className="text-muted-foreground text-sm">Total Points</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                +{points?.this_week || 0}
              </p>
              <p className="text-muted-foreground text-sm">This Week</p>
            </CardContent>
          </Card>
        </div>

        {/* Points Breakdown */}
        {points?.breakdown && points.breakdown.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Points by Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {points.breakdown.map((item) => (
                  <div
                    key={item.activity_type}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {getActivityEmoji(item.activity_type as ActivityType)}
                      </span>
                      <span className="text-sm capitalize">
                        {item.activity_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="font-medium">{item.total}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity History */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Activity History</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No activity yet. Start completing tasks to earn points!
              </p>
            ) : (
              <div className="space-y-0">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b py-3 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {getActivityEmoji(activity.activity_type)}
                      </span>
                      <div>
                        <p className="font-medium">{activity.activity_label}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatActivityTime(activity.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-green-600">
                      {formatPoints(activity.points)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How to Earn Points */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              How to Earn Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {(Object.entries(POINT_VALUES) as [ActivityType, number][]).map(
                ([type, value]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {getActivityEmoji(type)}{" "}
                      {type
                        .replace(/_/g, " ")
                        .replace(/^complete /, "")
                        .replace(/^create /, "")
                        .replace(/^earn /, "")}
                    </span>
                    <span className="font-medium">+{value} pts</span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
