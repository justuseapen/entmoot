import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuthStore } from "@/stores/auth";
import {
  getRankBadgeColor,
  type LeaderboardScope,
  type LeaderboardEntry,
} from "@/lib/leaderboard";

function MemberCard({
  entry,
  isCurrentUser,
  encouragementMessage,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  encouragementMessage: string;
}) {
  const rankColor = getRankBadgeColor(entry.rank);

  return (
    <Card
      className={`transition-shadow hover:shadow-md ${isCurrentUser ? "ring-primary ring-2" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Rank Badge */}
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 font-bold ${rankColor}`}
          >
            {entry.rank === 1 && <span className="text-lg">1</span>}
            {entry.rank === 2 && <span className="text-lg">2</span>}
            {entry.rank === 3 && <span className="text-lg">3</span>}
            {entry.rank > 3 && <span>{entry.rank}</span>}
          </div>

          {/* Avatar */}
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
            {entry.avatar_url ? (
              <img
                src={entry.avatar_url}
                alt={entry.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 text-lg font-medium text-white">
                {entry.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name and Stats */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">
                {entry.name}
                {isCurrentUser && (
                  <span className="text-muted-foreground ml-2 text-sm font-normal">
                    (You)
                  </span>
                )}
              </h3>
            </div>
            <p className="text-muted-foreground text-sm">
              {encouragementMessage}
            </p>
          </div>

          {/* Points */}
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600">{entry.points}</p>
            <p className="text-muted-foreground text-xs">points</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-4 flex gap-4 border-t pt-4">
          {/* Streaks */}
          <div className="flex flex-1 flex-col items-center">
            <div className="flex items-center gap-1 text-orange-500">
              <span className="text-lg">🔥</span>
              <span className="text-lg font-semibold">
                {entry.streaks.total}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">Total Streaks</span>
          </div>

          {/* Streak Breakdown */}
          <div className="flex flex-1 items-center justify-center gap-3">
            <div
              className="text-center"
              title={`Daily Planning: ${entry.streaks.daily_planning} day streak`}
            >
              <span className="text-sm">📅</span>
              <span className="ml-1 text-sm font-medium">
                {entry.streaks.daily_planning}
              </span>
            </div>
            <div
              className="text-center"
              title={`Evening Reflection: ${entry.streaks.evening_reflection} day streak`}
            >
              <span className="text-sm">🌙</span>
              <span className="ml-1 text-sm font-medium">
                {entry.streaks.evening_reflection}
              </span>
            </div>
            <div
              className="text-center"
              title={`Weekly Review: ${entry.streaks.weekly_review} week streak`}
            >
              <span className="text-sm">📊</span>
              <span className="ml-1 text-sm font-medium">
                {entry.streaks.weekly_review}
              </span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-1 flex-col items-center">
            <div className="flex items-center gap-1 text-purple-500">
              <span className="text-lg">🏆</span>
              <span className="text-lg font-semibold">
                {entry.badges_count}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">Badges</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopPerformerCard({
  name,
  avatarUrl,
  points,
}: {
  name: string;
  avatarUrl: string | null;
  points: number;
}) {
  return (
    <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>🏆</span>
          Top Performer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-200 ring-4 ring-yellow-300">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-yellow-400 to-amber-500 text-xl font-medium text-white">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold">{name}</h3>
            <p className="text-amber-600">
              <span className="text-2xl font-bold">{points}</span>
              <span className="text-muted-foreground ml-1 text-sm">points</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Leaderboard() {
  const { id } = useParams<{ id: string }>();
  const familyId = parseInt(id!, 10);
  const { user } = useAuthStore();

  const [scope, setScope] = useState<LeaderboardScope>("all_time");
  const {
    data: leaderboard,
    isLoading,
    error,
  } = useLeaderboard(familyId, scope);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="mx-auto max-w-2xl">
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error || !leaderboard) {
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
                  : "Failed to load leaderboard"}
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

  const getEncouragementMessage = (userId: number): string => {
    const msg = leaderboard.encouragement_messages.find(
      (m) => m.user_id === userId
    );
    return msg?.message || "Keep going!";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Family Leaderboard
              </h1>
              <p className="text-muted-foreground">
                See how your family is doing together
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to={`/families/${familyId}`}>Back to Family</Link>
            </Button>
          </div>

          {/* Scope Tabs */}
          <Tabs
            value={scope}
            onValueChange={(value) => setScope(value as LeaderboardScope)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all_time">All Time</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Top Performer Spotlight */}
        {leaderboard.top_performer && leaderboard.top_performer.points > 0 && (
          <div className="mb-6">
            <TopPerformerCard
              name={leaderboard.top_performer.name}
              avatarUrl={leaderboard.top_performer.avatar_url}
              points={leaderboard.top_performer.points}
            />
          </div>
        )}

        {/* Leaderboard Entries */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {scope === "weekly" ? "This Week's " : ""}Rankings
          </h2>
          {leaderboard.entries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No family members found. Invite some members to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            leaderboard.entries.map((entry) => (
              <MemberCard
                key={entry.user_id}
                entry={entry}
                isCurrentUser={entry.user_id === user?.id}
                encouragementMessage={getEncouragementMessage(entry.user_id)}
              />
            ))
          )}
        </div>

        {/* Legend */}
        <Card className="mt-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              How to Earn Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Complete a task</span>
                <span className="font-medium">+5 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Create a goal</span>
                <span className="font-medium">+15 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Evening reflection
                </span>
                <span className="font-medium">+20 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Complete a goal</span>
                <span className="font-medium">+30 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weekly review</span>
                <span className="font-medium">+50 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Streak milestone</span>
                <span className="font-medium">+50 pts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
