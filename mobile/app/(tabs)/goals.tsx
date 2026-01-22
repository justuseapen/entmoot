import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { FAB } from "react-native-paper";
import { COLORS } from "@/theme/colors";
import {
  useGoals,
  Goal,
  GoalTimeScale,
  GoalStatus,
} from "@/hooks/useGoals";

// ============================================================================
// Constants
// ============================================================================

const TIME_SCALE_TABS: { key: GoalTimeScale; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "annual", label: "Annual" },
];

const STATUS_COLORS: Record<GoalStatus, string> = {
  not_started: COLORS.statusNotStarted,
  in_progress: COLORS.statusInProgress,
  at_risk: COLORS.statusAtRisk,
  completed: COLORS.statusCompleted,
  abandoned: COLORS.statusAbandoned,
};

const STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  at_risk: "At Risk",
  completed: "Completed",
  abandoned: "Abandoned",
};

// ============================================================================
// Skeleton Components
// ============================================================================

function GoalCardSkeleton() {
  return (
    <View style={styles.goalCard}>
      <View style={[styles.skeletonText, { width: "70%", height: 20 }]} />
      <View style={styles.progressContainer}>
        <View style={[styles.progressBarBackground, { width: "100%" }]}>
          <View style={[styles.skeletonText, { width: "45%", height: 8, borderRadius: 4 }]} />
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={[styles.skeletonText, { width: 80, height: 16 }]} />
        <View style={[styles.skeletonText, { width: 60, height: 24, borderRadius: 12 }]} />
      </View>
    </View>
  );
}

function GoalsListSkeleton() {
  return (
    <View style={styles.listContent}>
      <GoalCardSkeleton />
      <GoalCardSkeleton />
      <GoalCardSkeleton />
    </View>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({ timeScale }: { timeScale: GoalTimeScale }) {
  const router = useRouter();

  return (
    <View style={styles.emptyState}>
      <Ionicons name="flag-outline" size={64} color={COLORS.textTertiary} />
      <Text style={styles.emptyTitle}>No {timeScale} goals yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first goal to start tracking your progress
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push("/goal/create")}
      >
        <Ionicons name="add" size={20} color={COLORS.textOnPrimary} />
        <Text style={styles.emptyButtonText}>Create your first goal</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Goal Card Component
// ============================================================================

interface GoalCardProps {
  goal: Goal;
  onPress: () => void;
}

function GoalCard({ goal, onPress }: GoalCardProps) {
  const statusColor = STATUS_COLORS[goal.status];
  const formattedDueDate = goal.due_date
    ? format(new Date(goal.due_date), "MMM d")
    : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.goalCard,
        pressed && styles.goalCardPressed,
      ]}
      onPress={onPress}
    >
      {/* Title */}
      <Text style={styles.goalTitle} numberOfLines={2}>
        {goal.title}
      </Text>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(0, goal.progress))}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{goal.progress}%</Text>
      </View>

      {/* Footer with due date and status badge */}
      <View style={styles.cardFooter}>
        {formattedDueDate ? (
          <View style={styles.dueDateContainer}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.dueDate}>{formattedDueDate}</Text>
          </View>
        ) : (
          <View />
        )}

        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: statusColor }]}
          />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[goal.status]}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================================
// Filter Tabs Component
// ============================================================================

interface FilterTabsProps {
  selectedTimeScale: GoalTimeScale;
  onSelectTimeScale: (timeScale: GoalTimeScale) => void;
}

function FilterTabs({ selectedTimeScale, onSelectTimeScale }: FilterTabsProps) {
  return (
    <View style={styles.filterTabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabsContent}
      >
        {TIME_SCALE_TABS.map((tab) => {
          const isSelected = tab.key === selectedTimeScale;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                isSelected && styles.filterTabSelected,
              ]}
              onPress={() => onSelectTimeScale(tab.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isSelected && styles.filterTabTextSelected,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Main Screen Component
// ============================================================================

export default function GoalsScreen() {
  const router = useRouter();
  const [selectedTimeScale, setSelectedTimeScale] = useState<GoalTimeScale>("weekly");

  // Fetch goals with selected time scale filter
  const {
    data: goals,
    isLoading,
    isFetching,
    refetch,
  } = useGoals({ time_scale: selectedTimeScale });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleGoalPress = useCallback(
    (goalId: number) => {
      router.push(`/goal/${goalId}`);
    },
    [router]
  );

  const handleCreateGoal = useCallback(() => {
    router.push("/goal/create");
  }, [router]);

  const renderGoalCard = useCallback(
    ({ item }: { item: Goal }) => (
      <GoalCard goal={item} onPress={() => handleGoalPress(item.id)} />
    ),
    [handleGoalPress]
  );

  const keyExtractor = useCallback((item: Goal) => item.id.toString(), []);

  const hasGoals = goals && goals.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Goals</Text>
      </View>

      {/* Filter tabs */}
      <FilterTabs
        selectedTimeScale={selectedTimeScale}
        onSelectTimeScale={setSelectedTimeScale}
      />

      {/* Goals list */}
      {isLoading ? (
        <GoalsListSkeleton />
      ) : hasGoals ? (
        <FlatList
          data={goals}
          renderItem={renderGoalCard}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          <EmptyState timeScale={selectedTimeScale} />
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        color={COLORS.textOnPrimary}
        onPress={handleCreateGoal}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },

  // Filter tabs
  filterTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  filterTabTextSelected: {
    color: COLORS.textOnPrimary,
  },

  // List
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100, // Space for FAB
  },
  emptyScrollContent: {
    flexGrow: 1,
  },

  // Goal card
  goalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },

  // Progress
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
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    minWidth: 36,
    textAlign: "right",
  },

  // Card footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dueDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Status badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: COLORS.primary,
  },

  // Skeleton
  skeletonText: {
    backgroundColor: COLORS.border,
    borderRadius: 4,
  },
});
