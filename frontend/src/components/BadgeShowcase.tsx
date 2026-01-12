import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserBadges } from "@/hooks/useBadges";
import {
  getCategoryLabel,
  getCategoryColor,
  formatEarnedDate,
  type UserBadge,
} from "@/lib/badges";

function BadgeItem({
  badge,
  onClick,
}: {
  badge: UserBadge;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
        badge.earned
          ? "border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-100"
          : "cursor-default border-gray-200 bg-gray-50 opacity-50"
      }`}
      title={badge.earned ? badge.name : `${badge.name} (Not earned yet)`}
    >
      <span className="text-2xl">{badge.icon}</span>
      <p className="text-muted-foreground max-w-full truncate text-xs">
        {badge.name}
      </p>
    </button>
  );
}

function BadgeDetailModal({
  badge,
  open,
  onClose,
}: {
  badge: UserBadge | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!badge) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-4xl">{badge.icon}</span>
            <div>
              <p className="text-xl">{badge.name}</p>
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-xs ${getCategoryColor(badge.category)}`}
              >
                {getCategoryLabel(badge.category)}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">{badge.description}</p>

          {badge.earned ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="font-medium text-green-800">Badge Earned!</p>
              <p className="text-sm text-green-600">
                {formatEarnedDate(badge.earned_at)}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-muted-foreground font-medium">
                Not yet earned
              </p>
              <p className="text-muted-foreground text-sm">
                Keep going to earn this badge!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BadgeShowcase({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, error } = useUserBadges();
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>🏆</span>
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid animate-pulse grid-cols-4 gap-2 sm:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-100" />
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
            <span>🏆</span>
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Could not load badges</p>
        </CardContent>
      </Card>
    );
  }

  const badges = data?.badges || [];
  const stats = data?.stats;
  const earnedBadges = badges.filter((b) => b.earned);
  const displayBadges = compact ? badges.slice(0, 8) : badges;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span>🏆</span>
              Badges
            </CardTitle>
            {stats && (
              <div className="text-right">
                <p className="text-xl font-bold text-purple-600">
                  {stats.earned_badges}/{stats.total_badges}
                </p>
                <p className="text-muted-foreground text-xs">
                  {stats.completion_percentage}% complete
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No badges available yet. Start using the app to earn badges!
            </p>
          ) : earnedBadges.length === 0 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                You haven&apos;t earned any badges yet. Keep going!
              </p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {displayBadges.map((badge) => (
                  <BadgeItem
                    key={badge.id}
                    badge={badge}
                    onClick={() => setSelectedBadge(badge)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {displayBadges.map((badge) => (
                <BadgeItem
                  key={badge.id}
                  badge={badge}
                  onClick={() => setSelectedBadge(badge)}
                />
              ))}
            </div>
          )}
          {compact && badges.length > 8 && (
            <p className="text-muted-foreground mt-2 text-center text-xs">
              +{badges.length - 8} more badges
            </p>
          )}
        </CardContent>
      </Card>

      <BadgeDetailModal
        badge={selectedBadge}
        open={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </>
  );
}
