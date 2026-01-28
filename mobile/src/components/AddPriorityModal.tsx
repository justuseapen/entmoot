import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import { useGoals, Goal } from "@/hooks/useGoals";
import { useUpdateDailyPlan, TopPriority } from "@/hooks/useDailyPlan";

// ============================================================================
// Types
// ============================================================================

interface AddPriorityModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** The daily plan ID to add the priority to */
  dailyPlanId: number;
  /** Current priorities count (to determine order) */
  currentPrioritiesCount: number;
  /** Callback when priority is successfully added */
  onPriorityAdded?: (priority: TopPriority) => void;
}

// ============================================================================
// Component
// ============================================================================

export function AddPriorityModal({
  visible,
  onClose,
  dailyPlanId,
  currentPrioritiesCount,
  onPriorityAdded,
}: AddPriorityModalProps) {
  // Refs
  const bottomSheetRef = useRef<BottomSheet>(null);
  const titleInputRef = useRef<TextInput>(null);

  // State
  const [title, setTitle] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const { data: goals, isLoading: isLoadingGoals } = useGoals({
    status: "in_progress",
  });
  const updateDailyPlan = useUpdateDailyPlan();

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ["50%", "75%"], []);

  // Filter to active/in-progress goals for the picker
  const availableGoals = useMemo(() => {
    if (!goals) return [];
    return goals.filter(
      (g) => g.status !== "completed" && g.status !== "abandoned"
    );
  }, [goals]);

  // Get selected goal name for display
  const selectedGoal = useMemo(() => {
    if (!selectedGoalId || !goals) return null;
    return goals.find((g) => g.id === selectedGoalId) ?? null;
  }, [selectedGoalId, goals]);

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        // Reset state when closed
        setTitle("");
        setSelectedGoalId(null);
        setShowGoalPicker(false);
        setError(null);
        onClose();
      }
    },
    [onClose]
  );

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Handle add priority
  const handleAddPriority = async () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Please enter a title for your priority");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await updateDailyPlan.mutateAsync({
        planId: dailyPlanId,
        payload: {
          daily_plan: {
            top_priorities_attributes: [
              {
                title: trimmedTitle,
                priority_order: currentPrioritiesCount,
                goal_id: selectedGoalId,
                completed: false,
              },
            ],
          },
        },
      });

      // Find the newly added priority in the response
      const newPriority = result.daily_plan.top_priorities.find(
        (p) => p.title === trimmedTitle
      );

      if (onPriorityAdded && newPriority) {
        onPriorityAdded(newPriority);
      }

      // Close the modal
      bottomSheetRef.current?.close();
    } catch (err) {
      console.error("Failed to add priority:", err);
      setError("Failed to add priority. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Close modal programmatically
  const handleClose = () => {
    bottomSheetRef.current?.close();
  };

  // Toggle goal picker
  const toggleGoalPicker = () => {
    setShowGoalPicker(!showGoalPicker);
  };

  // Select a goal
  const handleSelectGoal = (goal: Goal | null) => {
    setSelectedGoalId(goal?.id ?? null);
    setShowGoalPicker(false);
  };

  // Effect to open/close sheet based on visible prop
  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
      // Focus title input after sheet opens
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 300);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <BottomSheetView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle} accessibilityRole="header">Add Priority</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
              accessibilityHint="Close the add priority modal"
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={16} color={COLORS.error} accessibilityLabel="Error" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Title input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label} nativeID="priority-title-label">Title *</Text>
            <TextInput
              ref={titleInputRef}
              style={styles.input}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError(null);
              }}
              placeholder="What's your priority?"
              placeholderTextColor={COLORS.textSecondary}
              autoFocus
              returnKeyType="next"
              maxLength={200}
              accessibilityLabel="Priority title"
              accessibilityHint="Enter a title for your priority"
              accessibilityLabelledBy="priority-title-label"
              testID="add-priority-title-input"
            />
          </View>

          {/* Goal picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.label} accessibilityRole="text">Link to Goal (Optional)</Text>
            <TouchableOpacity
              style={styles.goalPicker}
              onPress={toggleGoalPicker}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={selectedGoal ? `Selected goal: ${selectedGoal.title}` : "Select a goal"}
              accessibilityHint="Open goal picker to link this priority to a goal"
              testID="add-priority-goal-picker"
            >
              {selectedGoal ? (
                <View style={styles.selectedGoalContainer}>
                  <Ionicons
                    name="flag"
                    size={16}
                    color={COLORS.primary}
                    style={styles.goalIcon}
                  />
                  <Text style={styles.selectedGoalText} numberOfLines={1}>
                    {selectedGoal.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleSelectGoal(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Remove selected goal"
                    accessibilityHint="Unlink this priority from the selected goal"
                    style={styles.clearGoalButton}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.goalPickerPlaceholder}>
                  <Ionicons
                    name="flag-outline"
                    size={16}
                    color={COLORS.textSecondary}
                    style={styles.goalIcon}
                  />
                  <Text style={styles.goalPickerPlaceholderText}>
                    Select a goal
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </View>
              )}
            </TouchableOpacity>

            {/* Goal options list */}
            {showGoalPicker && (
              <View style={styles.goalList}>
                {isLoadingGoals ? (
                  <View style={styles.loadingGoals}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingGoalsText}>
                      Loading goals...
                    </Text>
                  </View>
                ) : availableGoals.length === 0 ? (
                  <View style={styles.noGoals}>
                    <Text style={styles.noGoalsText}>
                      No active goals found
                    </Text>
                  </View>
                ) : (
                  availableGoals.map((goal) => (
                    <TouchableOpacity
                      key={goal.id}
                      style={[
                        styles.goalOption,
                        selectedGoalId === goal.id && styles.goalOptionSelected,
                      ]}
                      onPress={() => handleSelectGoal(goal)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${goal.title}, ${goal.time_scale}, ${goal.progress}% complete`}
                      accessibilityState={{ selected: selectedGoalId === goal.id }}
                    >
                      <Ionicons
                        name={
                          selectedGoalId === goal.id ? "flag" : "flag-outline"
                        }
                        size={16}
                        color={
                          selectedGoalId === goal.id
                            ? COLORS.primary
                            : COLORS.textSecondary
                        }
                      />
                      <View style={styles.goalOptionContent}>
                        <Text
                          style={[
                            styles.goalOptionTitle,
                            selectedGoalId === goal.id &&
                              styles.goalOptionTitleSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {goal.title}
                        </Text>
                        <Text style={styles.goalOptionMeta}>
                          {goal.time_scale} • {goal.progress}% complete
                        </Text>
                      </View>
                      {selectedGoalId === goal.id && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Add button */}
          <TouchableOpacity
            style={[
              styles.addButton,
              (!title.trim() || isSaving) && styles.addButtonDisabled,
            ]}
            onPress={handleAddPriority}
            disabled={!title.trim() || isSaving}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isSaving ? "Adding priority" : "Add Priority"}
            accessibilityHint="Save this priority to your daily plan"
            accessibilityState={{ disabled: !title.trim() || isSaving, busy: isSaving }}
            testID="add-priority-submit-button"
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.textOnPrimary} size="small" accessibilityLabel="Loading" />
            ) : (
              <>
                <Ionicons
                  name="add-circle"
                  size={20}
                  color={COLORS.textOnPrimary}
                />
                <Text style={styles.addButtonText}>Add Priority</Text>
              </>
            )}
          </TouchableOpacity>
        </BottomSheetView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  closeButton: {
    minWidth: 44, // iOS HIG touch target compliance
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.error + "15",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.error,
  },

  // Input
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44, // iOS HIG touch target compliance
  },

  // Goal picker
  goalPicker: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44, // iOS HIG touch target compliance
  },
  clearGoalButton: {
    minWidth: 44, // iOS HIG touch target compliance
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  goalPickerPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalPickerPlaceholderText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  goalIcon: {
    marginRight: 8,
  },
  selectedGoalContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedGoalText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },

  // Goal list
  goalList: {
    marginTop: 8,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 200,
    overflow: "hidden",
  },
  goalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    minHeight: 44, // iOS HIG touch target compliance
  },
  goalOptionSelected: {
    backgroundColor: COLORS.primary + "10",
  },
  goalOptionContent: {
    flex: 1,
  },
  goalOptionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  goalOptionTitleSelected: {
    color: COLORS.primary,
  },
  goalOptionMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loadingGoals: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  loadingGoalsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  noGoals: {
    paddingVertical: 20,
    alignItems: "center",
  },
  noGoalsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Add button
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: "auto",
    minHeight: 48, // iOS HIG touch target compliance (larger for primary action)
  },
  addButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },
});
