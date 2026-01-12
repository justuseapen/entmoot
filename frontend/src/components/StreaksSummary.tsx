import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStreaks } from "@/hooks/useStreaks";
import {
  getStreakLabel,
  getStreakEmoji,
  getStreakUnit,
  getTotalStreakCount,
  hasAtRiskStreak,
  type Streak,
} from "@/lib/streaks";

function StreakItem({ streak }: { streak: Streak }) {
  const label = getStreakLabel(streak.streak_type);
  const emoji = getStreakEmoji(streak.streak_type);
  const unit = getStreakUnit(streak.streak_type, streak.current_count);

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 ${
        streak.at_risk
          ? "animate-pulse border-orange-300 bg-orange-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {streak.at_risk && (
            <p className="text-xs text-orange-600">At risk! Complete today</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-lg">🔥</span>
        <span className="text-xl font-bold text-orange-500">
          {streak.current_count}
        </span>
        <span className="text-muted-foreground text-xs">{unit}</span>
      </div>
    </div>
  );
}

export function StreaksSummary() {
  const { data, isLoading, error } = useStreaks();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>🔥</span>
            Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-gray-100" />
            ))}
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
            <span>🔥</span>
            Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Could not load streaks
          </p>
        </CardContent>
      </Card>
    );
  }

  const streaks = data?.streaks || [];
  const totalCount = getTotalStreakCount(streaks);
  const hasRisk = hasAtRiskStreak(streaks);

  return (
    <Card className={hasRisk ? "ring-2 ring-orange-200" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>🔥</span>
            Streaks
          </CardTitle>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-sm">Total:</span>
            <span className="text-xl font-bold text-orange-500">
              {totalCount}
            </span>
          </div>
        </div>
        {hasRisk && (
          <p className="text-sm text-orange-600">
            Some streaks are at risk! Complete activities to maintain them.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {streaks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Start building your streaks by planning daily, reflecting, and
            completing weekly reviews!
          </p>
        ) : (
          streaks.map((streak) => (
            <StreakItem key={streak.id} streak={streak} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
