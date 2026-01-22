import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/theme/colors";
import {
  useGoal,
  useUpdateGoal,
  useDeleteGoal,
  Goal,
  GoalStatus,
  GoalUser,
} from "@/hooks/useGoals";

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS: { key: GoalStatus; label: string }[] = [
  { key: "not_started", label: "Not Started" },
  { key: "in_progress", label: "In Progress" },
  { key: "at_risk", label: "At Risk" },
  { key: "completed", label: "Completed" },
  { key: "abandoned", label: "Abandoned" },
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

const TIME_SCALE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

// ============================================================================
// Skeleton Component
// ============================================================================

function GoalDetailSkeleton() {
  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Title skeleton */}
      <View
        style={[
          styles.skeletonText,
          { width: "80%", height: 28, marginBottom: 8 },
        ]}
      />

      {/* Time scale and due date skeleton */}
      <View style={styles.metaRow}>
        <View style={[styles.skeletonText, { width: 60, height: 20 }]} />
        <View style={[styles.skeletonText, { width: 100, height: 20 }]} />
      </View>

      {/* Progress section skeleton */}
      <View style={styles.section}>
        <View
          style={[
            styles.skeletonText,
            { width: 80, height: 18, marginBottom: 12 },
          ]}
        />
        <View
          style={[
            styles.skeletonText,
            { width: "100%", height: 40, borderRadius: 8 },
          ]}
        />
      </View>

      {/* Status section skeleton */}
      <View style={styles.section}>
        <View
          style={[
            styles.skeletonText,
            { width: 60, height: 18, marginBottom: 12 },
          ]}
        />
        <View
          style={[
            styles.skeletonText,
            { width: "100%", height: 48, borderRadius: 8 },
          ]}
        />
      </View>

      {/* Description skeleton */}
      <View style={styles.section}>
        <View
          style={[
            styles.skeletonText,
            { width: 100, height: 18, marginBottom: 12 },
          ]}
        />
        <View style={[styles.skeletonText, { width: "100%", height: 60 }]} />
      </View>
    </ScrollView>
  );
}

// ============================================================================
// Smart Breakdown Section
// ============================================================================

interface SmartBreakdownProps {
  goal: Goal;
}

function SmartBreakdown({ goal }: SmartBreakdownProps) {
  const smartFields = [
    { key: "specific", label: "Specific", value: goal.specific },
    { key: "measurable", label: "Measurable", value: goal.measurable },
    { key: "achievable", label: "Achievable", value: goal.achievable },
    { key: "relevant", label: "Relevant", value: goal.relevant },
    { key: "time_bound", label: "Time-bound", value: goal.time_bound },
  ];

  // Only show if at least one SMART field is populated
  const hasSmartFields = smartFields.some((field) => field.value);
  if (!hasSmartFields) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>SMART Breakdown</Text>
      <View style={styles.smartContainer}>
        {smartFields.map((field) => {
          if (!field.value) return null;
          return (
            <View key={field.key} style={styles.smartField}>
              <View style={styles.smartLabelContainer}>
                <View
                  style={[styles.smartDot, { backgroundColor: COLORS.primary }]}
                />
                <Text style={styles.smartLabel}>{field.label}</Text>
              </View>
              <Text style={styles.smartValue}>{field.value}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================================
// Status Picker Section
// ============================================================================

interface StatusPickerProps {
  currentStatus: GoalStatus;
  onStatusChange: (status: GoalStatus) => void;
  isSaving: boolean;
}

function StatusPicker({
  currentStatus,
  onStatusChange,
  isSaving,
}: StatusPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelect = useCallback(
    (status: GoalStatus) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onStatusChange(status);
      setIsExpanded(false);
    },
    [onStatusChange]
  );

  const currentColor = STATUS_COLORS[currentStatus];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Status</Text>
        {isSaving && <ActivityIndicator size="small" color={COLORS.primary} />}
      </View>

      <TouchableOpacity
        style={styles.statusPickerButton}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.statusPickerContent}>
          <View style={[styles.statusDot, { backgroundColor: currentColor }]} />
          <Text style={[styles.statusPickerText, { color: currentColor }]}>
            {STATUS_LABELS[currentStatus]}
          </Text>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.statusOptions}>
          {STATUS_OPTIONS.map((option) => {
            const isSelected = option.key === currentStatus;
            const optionColor = STATUS_COLORS[option.key];
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.statusOption,
                  isSelected && styles.statusOptionSelected,
                ]}
                onPress={() => handleSelect(option.key)}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: optionColor }]}
                />
                <Text
                  style={[
                    styles.statusOptionText,
                    isSelected && styles.statusOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Progress Slider Section
// ============================================================================

interface ProgressSliderProps {
  progress: number;
  statusColor: string;
  onProgressChange: (value: number) => void;
  isSaving: boolean;
}

function ProgressSlider({
  progress,
  statusColor,
  onProgressChange,
  isSaving,
}: ProgressSliderProps) {
  const [localProgress, setLocalProgress] = useState(progress);

  const handleSlidingComplete = useCallback(
    (value: number) => {
      const roundedValue = Math.round(value);
      setLocalProgress(roundedValue);
      if (roundedValue !== progress) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onProgressChange(roundedValue);
      }
    },
    [progress, onProgressChange]
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.progressLabelContainer}>
          {isSaving && (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={[styles.progressValue, { color: statusColor }]}>
            {Math.round(localProgress)}%
          </Text>
        </View>
      </View>

      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={progress}
          onValueChange={setLocalProgress}
          onSlidingComplete={handleSlidingComplete}
          minimumTrackTintColor={statusColor}
          maximumTrackTintColor={COLORS.border}
          thumbTintColor={statusColor}
        />
      </View>
    </View>
  );
}

// ============================================================================
// Assignees Section
// ============================================================================

interface AssigneesSectionProps {
  assignees: GoalUser[];
}

function AssigneesSection({ assignees }: AssigneesSectionProps) {
  if (!assignees || assignees.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Assigned To</Text>
      <View style={styles.assigneesContainer}>
        {assignees.map((user) => (
          <View key={user.id} style={styles.assigneeItem}>
            <View style={styles.avatarContainer}>
              {user.avatar_url ? (
                <View style={styles.avatarImage}>
                  <Text style={styles.avatarText}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.assigneeName}>{user.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// Child Goals Section
// ============================================================================

interface ChildGoalsSectionProps {
  childGoals: Goal[];
  onGoalPress: (goalId: number) => void;
}

function ChildGoalsSection({
  childGoals,
  onGoalPress,
}: ChildGoalsSectionProps) {
  if (!childGoals || childGoals.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sub-Goals</Text>
      <View style={styles.childGoalsContainer}>
        {childGoals.map((child) => {
          const statusColor = STATUS_COLORS[child.status];
          return (
            <TouchableOpacity
              key={child.id}
              style={styles.childGoalCard}
              onPress={() => onGoalPress(child.id)}
              activeOpacity={0.7}
            >
              <View style={styles.childGoalContent}>
                <Text style={styles.childGoalTitle} numberOfLines={1}>
                  {child.title}
                </Text>
                <View style={styles.childGoalMeta}>
                  <View style={styles.childProgressContainer}>
                    <View style={styles.childProgressBar}>
                      <View
                        style={[
                          styles.childProgressFill,
                          {
                            width: `${child.progress}%`,
                            backgroundColor: statusColor,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.childProgressText}>
                      {child.progress}%
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.textTertiary}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================================
// Main Screen Component
// ============================================================================

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goalId = parseInt(id, 10);

  const { data: goal, isLoading, isFetching, refetch } = useGoal(goalId);
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEdit = useCallback(() => {
    // Navigate to edit screen (or could open edit modal)
    router.push(`/goal/edit/${goalId}`);
  }, [router, goalId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
              );
              await deleteGoal.mutateAsync(goalId);
              router.back();
            } catch {
              Alert.alert("Error", "Failed to delete goal. Please try again.");
            }
          },
        },
      ]
    );
  }, [goalId, deleteGoal, router]);

  const handleProgressChange = useCallback(
    async (value: number) => {
      setIsSavingProgress(true);
      try {
        await updateGoal.mutateAsync({
          goalId,
          payload: { progress: value },
        });
      } catch {
        Alert.alert("Error", "Failed to update progress. Please try again.");
      } finally {
        setIsSavingProgress(false);
      }
    },
    [goalId, updateGoal]
  );

  const handleStatusChange = useCallback(
    async (status: GoalStatus) => {
      setIsSavingStatus(true);
      try {
        await updateGoal.mutateAsync({
          goalId,
          payload: { status },
        });
      } catch {
        Alert.alert("Error", "Failed to update status. Please try again.");
      } finally {
        setIsSavingStatus(false);
      }
    },
    [goalId, updateGoal]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleChildGoalPress = useCallback(
    (childGoalId: number) => {
      router.push(`/goal/${childGoalId}`);
    },
    [router]
  );

  // Format due date
  const formattedDueDate = goal?.due_date
    ? format(new Date(goal.due_date), "MMMM d, yyyy")
    : null;

  // Get status color
  const statusColor = goal
    ? STATUS_COLORS[goal.status]
    : COLORS.statusNotStarted;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleEdit}
            style={styles.headerButton}
            disabled={isLoading}
          >
            <Ionicons name="pencil-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerButton}
            disabled={isLoading || deleteGoal.isPending}
          >
            {deleteGoal.isPending ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <Ionicons name="trash-outline" size={22} color={COLORS.error} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <GoalDetailSkeleton />
      ) : goal ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Title */}
          <Text style={styles.title}>{goal.title}</Text>

          {/* Meta info: time scale and due date */}
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons
                name="time-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>
                {TIME_SCALE_LABELS[goal.time_scale] || goal.time_scale}
              </Text>
            </View>
            {formattedDueDate && (
              <View style={styles.metaBadge}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.metaText}>Due {formattedDueDate}</Text>
              </View>
            )}
          </View>

          {/* Progress slider */}
          <ProgressSlider
            progress={goal.progress}
            statusColor={statusColor}
            onProgressChange={handleProgressChange}
            isSaving={isSavingProgress}
          />

          {/* Status picker */}
          <StatusPicker
            currentStatus={goal.status}
            onStatusChange={handleStatusChange}
            isSaving={isSavingStatus}
          />

          {/* Description */}
          {goal.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{goal.description}</Text>
            </View>
          )}

          {/* SMART breakdown */}
          <SmartBreakdown goal={goal} />

          {/* Assignees */}
          {goal.assignees && <AssigneesSection assignees={goal.assignees} />}

          {/* Child goals */}
          {goal.children && (
            <ChildGoalsSection
              childGoals={goal.children}
              onGoalPress={handleChildGoalPress}
            />
          )}

          {/* Creator info */}
          {goal.creator && (
            <View style={styles.creatorSection}>
              <Text style={styles.creatorText}>
                Created by {goal.creator.name} on{" "}
                {format(new Date(goal.created_at), "MMM d, yyyy")}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={COLORS.textTertiary}
          />
          <Text style={styles.errorText}>Goal not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Title and meta
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },

  // Progress slider
  progressLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  sliderContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slider: {
    width: "100%",
    height: 40,
  },

  // Status picker
  statusPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusPickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusPickerText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusOptions: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusOptionSelected: {
    backgroundColor: COLORS.primaryLight + "15",
  },
  statusOptionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  statusOptionTextSelected: {
    fontWeight: "600",
  },

  // Description
  descriptionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // SMART breakdown
  smartContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  smartField: {
    gap: 6,
  },
  smartLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  smartLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  smartValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    paddingLeft: 16,
  },

  // Assignees
  assigneesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  assigneeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    width: 28,
    height: 28,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },
  assigneeName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },

  // Child goals
  childGoalsContainer: {
    gap: 8,
  },
  childGoalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  childGoalContent: {
    flex: 1,
    marginRight: 8,
  },
  childGoalTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 8,
  },
  childGoalMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  childProgressContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  childProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  childProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  childProgressText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    minWidth: 36,
  },

  // Creator
  creatorSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  creatorText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: "center",
  },

  // Error state
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },

  // Skeleton
  skeletonText: {
    backgroundColor: COLORS.border,
    borderRadius: 4,
  },
});
