import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { COLORS } from "@/theme/colors";
import {
  FirstGoalPrompt,
  useFirstGoalPrompt,
} from "@/components/FirstGoalPrompt";
import {
  useTodayPlan,
  useUpdateDailyPlan,
  TopPriority,
} from "@/hooks/useDailyPlan";
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
// Intention Section Component
// ============================================================================

interface IntentionSectionProps {
  intention: string | null;
  dailyPlanId: number;
  isLoading?: boolean;
}

function IntentionSection({
  intention,
  dailyPlanId,
  isLoading = false,
}: IntentionSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localIntention, setLocalIntention] = useState(intention ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const updateDailyPlan = useUpdateDailyPlan();

  // Sync local state when prop changes (e.g., from server response)
  useEffect(() => {
    if (!isEditing) {
      setLocalIntention(intention ?? "");
    }
  }, [intention, isEditing]);

  const handlePress = () => {
    setIsEditing(true);
    // Focus the input after state update
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleBlur = async () => {
    setIsEditing(false);

    // Only save if the value has changed
    const trimmedIntention = localIntention.trim();
    const currentIntention = intention ?? "";

    if (trimmedIntention !== currentIntention) {
      setIsSaving(true);
      try {
        await updateDailyPlan.mutateAsync({
          planId: dailyPlanId,
          payload: {
            daily_plan: {
              intention: trimmedIntention || null,
            },
          },
        });
      } catch (error) {
        // Revert to previous value on error
        setLocalIntention(intention ?? "");
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Loading skeleton state
  if (isLoading) {
    return (
      <View style={styles.intentionSection}>
        <View style={styles.intentionHeader}>
          <Text style={styles.sectionTitle}>Today's Intention</Text>
        </View>
        <View style={[styles.skeletonText, styles.skeletonIntention]} />
      </View>
    );
  }

  return (
    <View style={styles.intentionSection}>
      <View style={styles.intentionHeader}>
        <Text style={styles.sectionTitle}>Today's Intention</Text>
        {isSaving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={COLORS.textSecondary} />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </View>

      {isEditing ? (
        <TextInput
          ref={inputRef}
          style={styles.intentionInput}
          value={localIntention}
          onChangeText={setLocalIntention}
          onBlur={handleBlur}
          placeholder="What's your focus for today?"
          placeholderTextColor={COLORS.textSecondary}
          multiline
          autoFocus
          returnKeyType="done"
          blurOnSubmit
        />
      ) : (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
          <Text
            style={[
              styles.intentionText,
              !intention && styles.intentionPlaceholder,
            ]}
          >
            {intention || "What's your focus for today?"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================================
// Top Priority Item Component
// ============================================================================

interface TopPriorityItemProps {
  priority: TopPriority;
  onToggleComplete: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}

function TopPriorityItem({
  priority,
  onToggleComplete,
  onDelete,
}: TopPriorityItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleComplete(priority.id, !priority.completed);
  };

  const handleDelete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeableRef.current?.close();
    onDelete(priority.id);
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={handleDelete}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons
            name="trash-outline"
            size={22}
            color={COLORS.textOnPrimary}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={styles.priorityItem}>
        {/* Checkbox */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            priority.completed && styles.checkboxCompleted,
          ]}
          onPress={handleToggle}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {priority.completed && (
            <Ionicons name="checkmark" size={16} color={COLORS.textOnPrimary} />
          )}
        </TouchableOpacity>

        {/* Priority content */}
        <View style={styles.priorityContent}>
          <Text
            style={[
              styles.priorityTitle,
              priority.completed && styles.priorityTitleCompleted,
            ]}
            numberOfLines={2}
          >
            {priority.title}
          </Text>

          {/* Goal badge */}
          {priority.goal && (
            <View style={styles.goalBadge}>
              <Ionicons name="flag-outline" size={12} color={COLORS.primary} />
              <Text style={styles.goalBadgeText} numberOfLines={1}>
                {priority.goal.title}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Swipeable>
  );
}

// ============================================================================
// Top Priorities Section Component
// ============================================================================

interface TopPrioritiesSectionProps {
  priorities: TopPriority[];
  dailyPlanId: number;
  isLoading?: boolean;
  onAddPriorityPress: () => void;
}

function TopPrioritiesSection({
  priorities,
  dailyPlanId,
  isLoading = false,
  onAddPriorityPress,
}: TopPrioritiesSectionProps) {
  const updateDailyPlan = useUpdateDailyPlan();
  const [isSaving, setIsSaving] = useState(false);

  // Sort priorities by priority_order
  const sortedPriorities = [...priorities].sort(
    (a, b) => a.priority_order - b.priority_order
  );

  const handleToggleComplete = async (id: number, completed: boolean) => {
    setIsSaving(true);
    try {
      await updateDailyPlan.mutateAsync({
        planId: dailyPlanId,
        payload: {
          daily_plan: {
            top_priorities_attributes: [{ id, completed }],
          },
        },
      });
    } catch (error) {
      // Error handling - optimistic update will rollback automatically
      console.error("Failed to update priority:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsSaving(true);
    try {
      await updateDailyPlan.mutateAsync({
        planId: dailyPlanId,
        payload: {
          daily_plan: {
            top_priorities_attributes: [{ id, _destroy: true }],
          },
        },
      });
    } catch (error) {
      console.error("Failed to delete priority:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const canAddMore = sortedPriorities.length < 3;

  // Loading skeleton state
  if (isLoading) {
    return (
      <View style={styles.prioritiesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Priorities</Text>
        </View>
        <View style={styles.skeletonPriorityList}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonPriorityItem}>
              <View style={styles.skeletonCheckbox} />
              <View style={styles.skeletonPriorityText} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.prioritiesSection}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Top Priorities</Text>
          {isSaving && (
            <View style={styles.savingIndicator}>
              <ActivityIndicator size="small" color={COLORS.textSecondary} />
            </View>
          )}
        </View>
        <Text style={styles.sectionSubtitle}>
          {sortedPriorities.length}/3 priorities
        </Text>
      </View>

      {/* Priority list */}
      {sortedPriorities.length > 0 ? (
        <View style={styles.priorityList}>
          {sortedPriorities.map((priority) => (
            <TopPriorityItem
              key={priority.id}
              priority={priority}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyPriorities}>
          <Text style={styles.emptyText}>No priorities set for today</Text>
        </View>
      )}

      {/* Add Priority button */}
      <TouchableOpacity
        style={[
          styles.addPriorityButton,
          !canAddMore && styles.addPriorityButtonDisabled,
        ]}
        onPress={onAddPriorityPress}
        disabled={!canAddMore}
        activeOpacity={0.7}
      >
        <Ionicons
          name="add-circle-outline"
          size={20}
          color={canAddMore ? COLORS.primary : COLORS.textTertiary}
        />
        <Text
          style={[
            styles.addPriorityButtonText,
            !canAddMore && styles.addPriorityButtonTextDisabled,
          ]}
        >
          Add Priority
        </Text>
      </TouchableOpacity>
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

  // Add Priority modal state (will be implemented in US-021)
  const [showAddPriorityModal, setShowAddPriorityModal] = useState(false);

  // Daily plan data
  const { data: dailyPlan, isLoading, isFetching, refetch } = useTodayPlan();

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

  const handleAddPriorityPress = () => {
    setShowAddPriorityModal(true);
    // TODO: Implement AddPriorityModal in US-021
    console.log("Add Priority pressed - modal to be implemented in US-021");
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
    <GestureHandlerRootView style={styles.gestureRoot}>
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
                <CompletionBadge
                  completed={totalCompleted}
                  total={totalItems}
                />
              )}
            </View>
          )}

          {/* Today's Intention Section */}
          <IntentionSection
            intention={dailyPlan?.intention ?? null}
            dailyPlanId={dailyPlan?.id ?? 0}
            isLoading={isLoading}
          />

          {/* Top Priorities Section */}
          <TopPrioritiesSection
            priorities={dailyPlan?.top_priorities ?? []}
            dailyPlanId={dailyPlan?.id ?? 0}
            isLoading={isLoading}
            onAddPriorityPress={handleAddPriorityPress}
          />

          {/* Placeholder for future sections */}
          <View style={styles.placeholderSection}>
            <Text style={styles.placeholderText}>
              More sections coming soon...
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
    </GestureHandlerRootView>
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

  // Intention section
  intentionSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  intentionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  intentionText: {
    fontSize: 18,
    fontWeight: "500",
    color: COLORS.text,
    lineHeight: 26,
  },
  intentionPlaceholder: {
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  intentionInput: {
    fontSize: 18,
    fontWeight: "500",
    color: COLORS.text,
    lineHeight: 26,
    padding: 0,
    minHeight: 26,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  savingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  skeletonIntention: {
    width: "80%",
    height: 24,
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

  // Gesture handler root
  gestureRoot: {
    flex: 1,
  },

  // Top Priorities section
  prioritiesSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },

  // Priority list
  priorityList: {
    gap: 4,
  },
  priorityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: COLORS.background,
  },

  // Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },

  // Priority content
  priorityContent: {
    flex: 1,
  },
  priorityTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    lineHeight: 22,
  },
  priorityTitleCompleted: {
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
  },

  // Goal badge
  goalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: COLORS.primary + "15",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  goalBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
    maxWidth: 150,
  },

  // Delete action (swipe)
  deleteAction: {
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderRadius: 8,
    marginLeft: 8,
  },

  // Empty state
  emptyPriorities: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },

  // Add Priority button
  addPriorityButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    borderStyle: "dashed",
  },
  addPriorityButtonDisabled: {
    borderColor: COLORS.border,
  },
  addPriorityButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  addPriorityButtonTextDisabled: {
    color: COLORS.textTertiary,
  },

  // Skeleton for priorities
  skeletonPriorityList: {
    gap: 12,
  },
  skeletonPriorityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  skeletonCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    marginRight: 12,
  },
  skeletonPriorityText: {
    flex: 1,
    height: 18,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
  },
});
