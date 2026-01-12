import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePoints } from "@/hooks/usePoints";
import {
  getActivityEmoji,
  formatPoints,
  formatActivityTime,
  type PointsActivity,
} from "@/lib/points";

function ActivityItem({ activity }: { activity: PointsActivity }) {
  const emoji = getActivityEmoji(activity.activity_type);

  return (
    <div className="flex items-center justify-between border-b py-2 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <div>
          <p className="text-sm font-medium">{activity.activity_label}</p>
          <p className="text-muted-foreground text-xs">
            {formatActivityTime(activity.created_at)}
          </p>
        </div>
      </div>
      <span className="font-semibold text-green-600">
        {formatPoints(activity.points)}
      </span>
    </div>
  );
}

export function PointsDisplay({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, error } = usePoints();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>⭐</span>
            Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 rounded-lg bg-gray-100" />
            <div className="h-8 rounded-lg bg-gray-100" />
            <div className="h-8 rounded-lg bg-gray-100" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>⭐</span>
            Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Could not load points</p>
        </CardContent>
      </Card>
    );
  }

  const points = data?.points;
  const recentActivity = data?.recent_activity || [];
  const displayActivity = compact ? recentActivity.slice(0, 3) : recentActivity;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>⭐</span>
            Points
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600">
              {points?.total || 0}
            </p>
            <p className="text-muted-foreground text-xs">total points</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weekly summary */}
        <div className="flex items-center justify-between rounded-lg bg-indigo-50 p-3">
          <span className="text-sm text-indigo-700">This week</span>
          <span className="font-bold text-indigo-600">
            +{points?.this_week || 0}
          </span>
        </div>

        {/* Recent activity */}
        {displayActivity.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-2 text-sm">
              Recent Activity
            </p>
            <div className="space-y-0">
              {displayActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Complete tasks and activities to earn points!
          </p>
        )}

        {/* View all link */}
        {!compact && recentActivity.length > 5 && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/points">View All Activity</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
