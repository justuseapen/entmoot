import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "date-fns";
import { COLORS } from "@/theme/colors";
import {
  FirstGoalPrompt,
  useFirstGoalPrompt,
} from "@/components/FirstGoalPrompt";
import { useTodayPlan } from "@/hooks/useDailyPlan";
import { useAuthStore } from "@/stores/auth";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Returns a greeting based on the current hour.
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  } else if (hour < 17) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

/**
 * Returns the first name from a full name string.
 */
function getFirstName(fullName: string | undefined | null): string {
  if (!fullName) return "";
  return fullName.split(" ")[0];
}

// ============================================================================
// Skeleton Component
// ============================================================================

function TodayHeaderSkeleton() {
  return (
    <View style={styles.header}>
      {/* Date skeleton */}
      <View style={[styles.skeletonText, styles.skeletonDate]} />
      {/* Greeting skeleton */}
      <View style={[styles.skeletonText, styles.skeletonGreeting]} />
      {/* Completion badge skeleton */}
      <View style={[styles.skeletonBadge]} />
    </View>
  );
}

// ============================================================================
// Completion Badge Component
// ============================================================================

interface CompletionBadgeProps {
  completed: number;
  total: number;
}

function CompletionBadge({ completed, total }: CompletionBadgeProps) {
  const isAllComplete = total > 0 && completed === total;

  return (
    <View
      style={[
        styles.completionBadge,
        isAllComplete && styles.completionBadgeComplete,
      ]}
    >
      <Text
        style={[
          styles.completionText,
          isAllComplete && styles.completionTextComplete,
        ]}
      >
        {completed}/{total} completed
      </Text>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function TodayScreen() {
  // Auth state
  const user = useAuthStore((state) => state.user);

  // First goal prompt
  const { isEligible, isChecking, dismiss } = useFirstGoalPrompt();
  const [showPrompt, setShowPrompt] = useState(false);

  // Daily plan data
  const {
    data: dailyPlan,
    isLoading,
    isFetching,
    refetch,
  } = useTodayPlan();

  // Show prompt when eligibility check completes and user is eligible
  useEffect(() => {
    if (!isChecking && isEligible) {
      setShowPrompt(true);
    }
  }, [isChecking, isEligible]);

  const handleClosePrompt = () => {
    setShowPrompt(false);
    dismiss();
  };

  const handleGoalCreated = (_goalId: number) => {
    // Could navigate to goal detail or refresh goals list
    // For now, just close the prompt
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Calculate total completion stats
  const completionStats = dailyPlan?.completion_stats;
  const totalCompleted =
    (completionStats?.tasks_completed ?? 0) +
    (completionStats?.priorities_completed ?? 0) +
    (completionStats?.habits_completed ?? 0);
  const totalItems =
    (completionStats?.tasks_total ?? 0) +
    (completionStats?.priorities_total ?? 0) +
    (completionStats?.habits_total ?? 0);

  // Format today's date
  const todayDate = format(new Date(), "EEEE, MMMM d");

  // Build greeting
  const greeting = `${getGreeting()}, ${getFirstName(user?.name)}`;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header Section */}
        {isLoading ? (
          <TodayHeaderSkeleton />
        ) : (
          <View style={styles.header}>
            {/* Date */}
            <Text style={styles.dateText}>{todayDate}</Text>

            {/* Greeting */}
            <Text style={styles.greetingText}>{greeting}</Text>

            {/* Completion Badge */}
            {dailyPlan && (
              <CompletionBadge completed={totalCompleted} total={totalItems} />
            )}
          </View>
        )}

        {/* Placeholder for future sections */}
        <View style={styles.placeholderSection}>
          <Text style={styles.placeholderText}>
            Daily planning sections coming soon...
          </Text>
        </View>
      </ScrollView>

      {/* First Goal Prompt Modal */}
      <FirstGoalPrompt
        visible={showPrompt}
        onClose={handleClosePrompt}
        onGoalCreated={handleGoalCreated}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Header styles
  header: {
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },

  // Completion badge
  completionBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completionBadgeComplete: {
    backgroundColor: COLORS.success + "20", // 20% opacity
  },
  completionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  completionTextComplete: {
    color: COLORS.success,
  },

  // Skeleton styles
  skeletonText: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
  },
  skeletonDate: {
    width: 140,
    height: 16,
    marginBottom: 8,
  },
  skeletonGreeting: {
    width: 220,
    height: 32,
    marginBottom: 16,
  },
  skeletonBadge: {
    width: 110,
    height: 28,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },

  // Placeholder section
  placeholderSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
