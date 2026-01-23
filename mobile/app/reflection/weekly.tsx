import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { COLORS } from "@/theme/colors";
import {
  useCurrentWeeklyReview,
  useUpdateWeeklyReview,
  WeeklyReview,
  WeeklyReviewMetrics,
  HabitTally,
} from "@/hooks";

// ============================================================================
// Types
// ============================================================================

/** Props for the ReviewTextSection component */
interface ReviewTextSectionProps {
  title: string;
  value: string | null;
  placeholder: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  isSaving?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Props for the MetricsCard component */
interface MetricsCardProps {
  metrics: WeeklyReviewMetrics | undefined;
  habitTally: HabitTally | undefined;
}

// ============================================================================
// Constants
// ============================================================================

const DEBOUNCE_MS = 500;

// ============================================================================
// Metrics Card Component
// ============================================================================

function MetricsCard({ metrics, habitTally }: MetricsCardProps) {
  if (!metrics) {
    return null;
  }

  const { task_completion, goal_progress } = metrics;

  return (
    <View style={styles.metricsCard}>
      <View style={styles.metricsHeader}>
        <Ionicons name="stats-chart" size={20} color={COLORS.primary} />
        <Text style={styles.metricsTitle}>This Week at a Glance</Text>
      </View>

      {/* Task Completion */}
      <View style={styles.metricRow}>
        <View style={styles.metricLabelContainer}>
          <Ionicons
            name="checkmark-done-outline"
            size={18}
            color={COLORS.textSecondary}
          />
          <Text style={styles.metricLabel}>Tasks Completed</Text>
        </View>
        <View style={styles.metricValueContainer}>
          <Text style={styles.metricValue}>
            {task_completion.completed_tasks}/{task_completion.total_tasks}
          </Text>
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText}>
              {task_completion.completion_rate}%
            </Text>
          </View>
        </View>
      </View>

      {/* Days with Plans */}
      <View style={styles.metricRow}>
        <View style={styles.metricLabelContainer}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={COLORS.textSecondary}
          />
          <Text style={styles.metricLabel}>Days Planned</Text>
        </View>
        <Text style={styles.metricValue}>
          {task_completion.days_with_plans}/7
        </Text>
      </View>

      {/* Goal Progress */}
      <View style={styles.metricRow}>
        <View style={styles.metricLabelContainer}>
          <Ionicons
            name="trophy-outline"
            size={18}
            color={COLORS.textSecondary}
          />
          <Text style={styles.metricLabel}>Goals Progress</Text>
        </View>
        <View style={styles.metricValueContainer}>
          <Text style={styles.metricValue}>
            {goal_progress.completed_goals}/{goal_progress.total_goals}
          </Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              Avg: {goal_progress.average_progress}%
            </Text>
          </View>
        </View>
      </View>

      {/* Goal Status Breakdown */}
      {goal_progress.total_goals > 0 && (
        <View style={styles.goalStatusRow}>
          <View style={[styles.statusBadge, styles.statusInProgress]}>
            <Text style={styles.statusBadgeText}>
              {goal_progress.in_progress_goals} In Progress
            </Text>
          </View>
          {goal_progress.at_risk_goals > 0 && (
            <View style={[styles.statusBadge, styles.statusAtRisk]}>
              <Text style={styles.statusBadgeText}>
                {goal_progress.at_risk_goals} At Risk
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Habit Tally */}
      {habitTally && Object.keys(habitTally).length > 0 && (
        <View style={styles.habitTallySection}>
          <Text style={styles.habitTallyTitle}>Habit Completions</Text>
          <View style={styles.habitTallyList}>
            {Object.entries(habitTally).map(([habit, count]) => (
              <View key={habit} style={styles.habitTallyItem}>
                <Text style={styles.habitTallyName}>{habit}</Text>
                <View style={styles.habitTallyCount}>
                  <Text style={styles.habitTallyCountText}>{count}x</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Review Text Section Component
// ============================================================================

function ReviewTextSection({
  title,
  value,
  placeholder,
  onChangeText,
  onBlur,
  isSaving,
  icon = "create-outline",
}: ReviewTextSectionProps) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
        {isSaving && (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.savingIndicator}
          />
        )}
      </View>
      <TextInput
        style={styles.textInput}
        value={value ?? ""}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
  );
}

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {/* Metrics skeleton */}
      <View style={[styles.skeleton, styles.skeletonMetrics]} />

      {/* Section skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.skeletonSection}>
          <View style={[styles.skeleton, styles.skeletonTitle]} />
          <View style={[styles.skeleton, styles.skeletonTextArea]} />
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function WeeklyReviewScreen() {
  const {
    data: weeklyReview,
    isLoading,
    isFetching,
    refetch,
  } = useCurrentWeeklyReview();
  const updateWeeklyReview = useUpdateWeeklyReview();

  // Local form state
  const [winsShipped, setWinsShipped] = useState("");
  const [lossesFriction, setLossesFriction] = useState("");
  const [metricsNotes, setMetricsNotes] = useState("");
  const [systemToAdjust, setSystemToAdjust] = useState("");

  // Saving states for each field
  const [savingField, setSavingField] = useState<string | null>(null);

  // Debounce timers
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );

  // Sync local state from server data
  useEffect(() => {
    if (weeklyReview) {
      setWinsShipped(weeklyReview.wins_shipped ?? "");
      setLossesFriction(weeklyReview.losses_friction ?? "");
      setMetricsNotes(weeklyReview.metrics_notes ?? "");
      setSystemToAdjust(weeklyReview.system_to_adjust ?? "");
    }
  }, [weeklyReview]);

  // Save function with debounce
  const saveField = useCallback(
    (field: keyof WeeklyReview, value: string | null) => {
      if (!weeklyReview) return;

      // Clear existing timer for this field
      if (debounceTimers.current[field]) {
        clearTimeout(debounceTimers.current[field]);
      }

      // Set new debounced save
      debounceTimers.current[field] = setTimeout(async () => {
        // Only save if value actually changed
        if (weeklyReview[field] === value) return;

        setSavingField(field);
        try {
          await updateWeeklyReview.mutateAsync({
            reviewId: weeklyReview.id,
            payload: { [field]: value || null },
          });
        } catch (error) {
          console.error(`Failed to save ${field}:`, error);
        } finally {
          setSavingField(null);
        }
      }, DEBOUNCE_MS);
    },
    [weeklyReview, updateWeeklyReview]
  );

  // Handler for blur event (immediate save)
  const handleBlurSave = useCallback(
    (field: keyof WeeklyReview, value: string) => {
      if (!weeklyReview) return;

      // Clear any pending debounce timer
      if (debounceTimers.current[field]) {
        clearTimeout(debounceTimers.current[field]);
      }

      // Only save if value changed
      if (weeklyReview[field] === value) return;
      if (weeklyReview[field] === null && value === "") return;

      setSavingField(field);
      updateWeeklyReview
        .mutateAsync({
          reviewId: weeklyReview.id,
          payload: { [field]: value || null },
        })
        .catch((error) => {
          console.error(`Failed to save ${field}:`, error);
        })
        .finally(() => {
          setSavingField(null);
        });
    },
    [weeklyReview, updateWeeklyReview]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  // Format the week date range
  const formattedWeekRange = weeklyReview
    ? `${format(parseISO(weeklyReview.week_start_date), "MMM d")} - ${format(
        new Date(
          new Date(weeklyReview.week_start_date).getTime() +
            6 * 24 * 60 * 60 * 1000
        ),
        "MMM d, yyyy"
      )}`
    : "";

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.headerTitle}>Weekly Review</Text>
            <Text style={styles.headerSubtitle}>{formattedWeekRange}</Text>
          </View>

          {/* Metrics Card */}
          <MetricsCard
            metrics={weeklyReview?.metrics}
            habitTally={weeklyReview?.habit_tally}
          />

          {/* Wins Shipped */}
          <ReviewTextSection
            title="Wins Shipped"
            value={winsShipped}
            placeholder="What did you accomplish this week? What went well?"
            onChangeText={(text) => {
              setWinsShipped(text);
              saveField("wins_shipped", text);
            }}
            onBlur={() => handleBlurSave("wins_shipped", winsShipped)}
            isSaving={savingField === "wins_shipped"}
            icon="trophy-outline"
          />

          {/* Losses / Friction */}
          <ReviewTextSection
            title="Losses / Friction"
            value={lossesFriction}
            placeholder="What didn't go as planned? What challenges did you face?"
            onChangeText={(text) => {
              setLossesFriction(text);
              saveField("losses_friction", text);
            }}
            onBlur={() => handleBlurSave("losses_friction", lossesFriction)}
            isSaving={savingField === "losses_friction"}
            icon="cloud-outline"
          />

          {/* Metrics Notes */}
          <ReviewTextSection
            title="Metrics Notes"
            value={metricsNotes}
            placeholder="Any observations about your numbers this week?"
            onChangeText={(text) => {
              setMetricsNotes(text);
              saveField("metrics_notes", text);
            }}
            onBlur={() => handleBlurSave("metrics_notes", metricsNotes)}
            isSaving={savingField === "metrics_notes"}
            icon="analytics-outline"
          />

          {/* System to Adjust */}
          <ReviewTextSection
            title="System to Adjust"
            value={systemToAdjust}
            placeholder="What process or system needs improvement?"
            onChangeText={(text) => {
              setSystemToAdjust(text);
              saveField("system_to_adjust", text);
            }}
            onBlur={() => handleBlurSave("system_to_adjust", systemToAdjust)}
            isSaving={savingField === "system_to_adjust"}
            icon="settings-outline"
          />

          {/* Auto-save hint */}
          <View style={styles.autoSaveHint}>
            <Ionicons
              name="cloud-done-outline"
              size={14}
              color={COLORS.textTertiary}
            />
            <Text style={styles.autoSaveHintText}>
              Changes are saved automatically
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // Header
  header: {
    alignItems: "center",
    paddingVertical: 24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Metrics Card
  metricsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 8,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  metricLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  metricValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  percentageBadge: {
    backgroundColor: COLORS.success + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.success,
  },
  progressBadge: {
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  goalStatusRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusInProgress: {
    backgroundColor: COLORS.primary + "15",
  },
  statusAtRisk: {
    backgroundColor: COLORS.warning + "15",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.text,
  },

  // Habit Tally
  habitTallySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  habitTallyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  habitTallyList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  habitTallyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  habitTallyName: {
    fontSize: 13,
    color: COLORS.text,
    marginRight: 6,
  },
  habitTallyCount: {
    backgroundColor: COLORS.secondary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  habitTallyCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.secondary,
  },

  // Section
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  savingIndicator: {
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 120,
  },

  // Auto-save hint
  autoSaveHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 12,
  },
  autoSaveHintText: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },

  // Loading skeleton
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  skeleton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  skeletonMetrics: {
    height: 200,
    marginBottom: 24,
  },
  skeletonSection: {
    marginBottom: 24,
  },
  skeletonTitle: {
    height: 20,
    width: 120,
    marginBottom: 12,
  },
  skeletonTextArea: {
    height: 120,
  },
});
