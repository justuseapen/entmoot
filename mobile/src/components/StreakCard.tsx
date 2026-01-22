import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/theme/colors";
import {
  Streak,
  STREAK_CONFIG,
  isStreakMilestone,
} from "@/hooks/useStreaks";

interface StreakCardProps {
  streak: Streak;
}

/**
 * StreakCard displays a single streak with its current count, best count,
 * milestone highlighting, and at-risk indicator.
 */
export function StreakCard({ streak }: StreakCardProps) {
  const config = STREAK_CONFIG[streak.streak_type];
  if (!config) return null;

  const isMilestone = isStreakMilestone(streak.current_count);
  const showAtRisk = streak.at_risk && streak.current_count > 0;

  return (
    <View
      style={[
        styles.card,
        showAtRisk && styles.cardAtRisk,
        isMilestone && styles.cardMilestone,
      ]}
    >
      {/* Icon */}
      <Ionicons
        name={config.icon as keyof typeof Ionicons.glyphMap}
        size={24}
        color={showAtRisk ? COLORS.warning : COLORS.primary}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.label}>{config.label}</Text>
        <View style={styles.countRow}>
          <Text style={styles.count}>{streak.current_count}</Text>
          <Text style={styles.fireEmoji}>🔥</Text>
        </View>
        <Text style={styles.best}>Best: {streak.longest_count} days</Text>
      </View>

      {/* At Risk Indicator */}
      {showAtRisk && (
        <View style={styles.atRiskBadge}>
          <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
        </View>
      )}

      {/* Milestone Badge */}
      {isMilestone && !showAtRisk && (
        <View style={styles.milestoneBadge}>
          <Text style={styles.milestoneText}>🎉</Text>
        </View>
      )}
    </View>
  );
}

interface StreakCardsRowProps {
  streaks: Streak[] | undefined;
  isLoading?: boolean;
}

/**
 * StreakCardsRow displays all streaks in a horizontal row with loading state.
 */
export function StreakCardsRow({ streaks, isLoading }: StreakCardsRowProps) {
  if (isLoading) {
    return (
      <View style={styles.row}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.card, styles.skeleton]} />
        ))}
      </View>
    );
  }

  if (!streaks || streaks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="flame-outline"
          size={32}
          color={COLORS.textTertiary}
        />
        <Text style={styles.emptyText}>
          Start activities to build your streaks!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {streaks.map((streak) => (
        <StreakCard key={streak.id} streak={streak} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Row container
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  // Card styles
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 100,
  },
  cardAtRisk: {
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  cardMilestone: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "08",
  },

  // Content
  content: {
    alignItems: "center",
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  count: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },
  fireEmoji: {
    fontSize: 18,
  },
  best: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // Badges
  atRiskBadge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  milestoneBadge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  milestoneText: {
    fontSize: 14,
  },

  // Empty state
  emptyContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 8,
    textAlign: "center",
  },

  // Skeleton
  skeleton: {
    backgroundColor: COLORS.surface,
    opacity: 0.6,
  },
});
