import { View, StyleSheet } from "react-native";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { COLORS } from "@/theme/colors";

/**
 * Goal card skeleton matching the GoalCard component layout
 */
function GoalCardSkeleton() {
  return (
    <SkeletonCard style={styles.goalCard}>
      {/* Title */}
      <Skeleton width="70%" height={20} style={styles.titleSkeleton} />

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <Skeleton
            width="45%"
            height={8}
            borderRadius={4}
          />
        </View>
        <Skeleton width={36} height={16} />
      </View>

      {/* Footer with due date and status */}
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={16} />
        <Skeleton width={90} height={24} borderRadius={12} />
      </View>
    </SkeletonCard>
  );
}

/**
 * Full goals list skeleton component
 * Matches the layout of the Goals screen while content is loading
 */
export function GoalsListSkeleton() {
  return (
    <View style={styles.listContent}>
      <GoalCardSkeleton />
      <GoalCardSkeleton />
      <GoalCardSkeleton />
    </View>
  );
}

// Export individual card skeleton for reuse
export { GoalCardSkeleton };

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100, // Space for FAB
  },
  goalCard: {
    padding: 16,
  },
  titleSkeleton: {
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
