import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/theme/colors";
import {
  useCreateGoal,
  useRefineGoal,
  GoalTimeScale,
  GoalVisibility,
  CreateGoalPayload,
  SmartSuggestions,
  GoalRefinementResponse,
} from "@/hooks/useGoals";
import { AIRefinementModal } from "@/components";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

// ============================================================================
// Types
// ============================================================================

interface FamilyMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

// ============================================================================
// Constants
// ============================================================================

const TIME_SCALES: { key: GoalTimeScale; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "annual", label: "Annual" },
];

const VISIBILITY_OPTIONS: {
  key: GoalVisibility;
  label: string;
  description: string;
}[] = [
  {
    key: "personal",
    label: "Personal",
    description: "Only you can see this goal",
  },
  {
    key: "shared",
    label: "Shared",
    description: "Visible to assigned family members",
  },
  {
    key: "family",
    label: "Family",
    description: "Visible to all family members",
  },
];

// ============================================================================
// Time Scale Segmented Control
// ============================================================================

interface TimeScaleControlProps {
  value: GoalTimeScale;
  onChange: (value: GoalTimeScale) => void;
}

function TimeScaleControl({ value, onChange }: TimeScaleControlProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Time Scale</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeScaleContainer}
      >
        {TIME_SCALES.map((scale) => {
          const isSelected = value === scale.key;
          return (
            <TouchableOpacity
              key={scale.key}
              style={[
                styles.timeScaleButton,
                isSelected && styles.timeScaleButtonSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(scale.key);
              }}
            >
              <Text
                style={[
                  styles.timeScaleText,
                  isSelected && styles.timeScaleTextSelected,
                ]}
              >
                {scale.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Date Picker Section
// ============================================================================

interface DatePickerSectionProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

function DatePickerSection({ value, onChange }: DatePickerSectionProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = useCallback(
    (_event: unknown, selectedDate?: Date) => {
      setShowPicker(Platform.OS === "ios");
      if (selectedDate) {
        onChange(selectedDate);
      }
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Due Date (Optional)</Text>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={value ? COLORS.primary : COLORS.textSecondary}
        />
        <Text
          style={[
            styles.datePickerText,
            !value && styles.datePickerPlaceholder,
          ]}
        >
          {value ? format(value, "MMMM d, yyyy") : "Select a due date"}
        </Text>
        {value && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}

// ============================================================================
// Visibility Picker Section
// ============================================================================

interface VisibilityPickerProps {
  value: GoalVisibility;
  onChange: (value: GoalVisibility) => void;
}

function VisibilityPicker({ value, onChange }: VisibilityPickerProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Visibility</Text>
      <View style={styles.visibilityContainer}>
        {VISIBILITY_OPTIONS.map((option) => {
          const isSelected = value === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.visibilityOption,
                isSelected && styles.visibilityOptionSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(option.key);
              }}
            >
              <View style={styles.visibilityRadio}>
                {isSelected && <View style={styles.visibilityRadioInner} />}
              </View>
              <View style={styles.visibilityTextContainer}>
                <Text
                  style={[
                    styles.visibilityLabel,
                    isSelected && styles.visibilityLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.visibilityDescription}>
                  {option.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================================
// Assignee Multi-Select Section
// ============================================================================

interface AssigneeSelectProps {
  members: FamilyMember[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  isLoading: boolean;
}

function AssigneeSelect({
  members,
  selectedIds,
  onChange,
  isLoading,
}: AssigneeSelectProps) {
  const handleToggle = useCallback(
    (userId: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (selectedIds.includes(userId)) {
        onChange(selectedIds.filter((id) => id !== userId));
      } else {
        onChange([...selectedIds, userId]);
      }
    },
    [selectedIds, onChange]
  );

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Assign To (Optional)</Text>
        <View style={styles.assigneeLoadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.assigneeLoadingText}>
            Loading family members...
          </Text>
        </View>
      </View>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Assign To (Optional)</Text>
      <View style={styles.assigneesContainer}>
        {members.map((member) => {
          const isSelected = selectedIds.includes(member.user_id);
          return (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.assigneeItem,
                isSelected && styles.assigneeItemSelected,
              ]}
              onPress={() => handleToggle(member.user_id)}
            >
              <View
                style={[
                  styles.assigneeAvatar,
                  isSelected && styles.assigneeAvatarSelected,
                ]}
              >
                <Text style={styles.assigneeAvatarText}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text
                style={[
                  styles.assigneeName,
                  isSelected && styles.assigneeNameSelected,
                ]}
                numberOfLines={1}
              >
                {member.name}
              </Text>
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.primary}
                />
              )}
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

export default function CreateGoalScreen() {
  const router = useRouter();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);
  const createGoal = useCreateGoal();
  const refineGoal = useRefineGoal();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeScale, setTimeScale] = useState<GoalTimeScale>("weekly");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [visibility, setVisibility] = useState<GoalVisibility>("personal");
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);

  // SMART fields state (populated by AI refinement)
  const [specific, setSpecific] = useState<string | null>(null);
  const [measurable, setMeasurable] = useState<string | null>(null);
  const [achievable, setAchievable] = useState<string | null>(null);
  const [relevant, setRelevant] = useState<string | null>(null);
  const [timeBound, setTimeBound] = useState<string | null>(null);

  // Family members state
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // UI state
  const [titleError, setTitleError] = useState<string | null>(null);

  // AI Refinement state
  const [showRefinementModal, setShowRefinementModal] = useState(false);
  const [refinementSuggestions, setRefinementSuggestions] = useState<
    GoalRefinementResponse["suggestions"] | null
  >(null);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [createdGoalId, setCreatedGoalId] = useState<number | null>(null);

  // Fetch family members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentFamilyId) {
        setMembersLoading(false);
        return;
      }

      try {
        const response = await api.get<{ members: FamilyMember[] }>(
          `/families/${currentFamilyId}/members`
        );
        setFamilyMembers(response.members);
      } catch {
        // Silently fail - assignee selection just won't be available
        console.warn("Failed to fetch family members");
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, [currentFamilyId]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const buildPayload = useCallback((): CreateGoalPayload => {
    const payload: CreateGoalPayload = {
      title: title.trim(),
      time_scale: timeScale,
      visibility,
    };

    if (description.trim()) {
      payload.description = description.trim();
    }

    if (dueDate) {
      payload.due_date = format(dueDate, "yyyy-MM-dd");
    }

    if (assigneeIds.length > 0) {
      payload.assignee_ids = assigneeIds;
    }

    // Include SMART fields if set
    if (specific) payload.specific = specific;
    if (measurable) payload.measurable = measurable;
    if (achievable) payload.achievable = achievable;
    if (relevant) payload.relevant = relevant;
    if (timeBound) payload.time_bound = timeBound;

    return payload;
  }, [
    title,
    description,
    timeScale,
    dueDate,
    visibility,
    assigneeIds,
    specific,
    measurable,
    achievable,
    relevant,
    timeBound,
  ]);

  const handleCreate = useCallback(async () => {
    // Validate title
    if (!title.trim()) {
      setTitleError("Please enter a goal title");
      return;
    }

    const payload = buildPayload();

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await createGoal.mutateAsync(payload);

      // Navigate to the newly created goal
      router.replace(`/goal/${response.goal.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create goal";
      Alert.alert("Error", message);
    }
  }, [buildPayload, createGoal, router, title]);

  const handleRefineWithAI = useCallback(async () => {
    // Validate title
    if (!title.trim()) {
      setTitleError("Please enter a goal title first");
      return;
    }

    setIsRefining(true);
    setShowRefinementModal(true);
    setRefinementSuggestions(null);
    setRefinementError(null);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Step 1: Create the goal first
      const payload = buildPayload();
      const createResponse = await createGoal.mutateAsync(payload);
      const goalId = createResponse.goal.id;
      setCreatedGoalId(goalId);

      // Step 2: Refine the newly created goal
      const refineResponse = await refineGoal.mutateAsync(goalId);
      setRefinementSuggestions(refineResponse.suggestions);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to get AI suggestions. Please try again.";
      setRefinementError(message);
    } finally {
      setIsRefining(false);
    }
  }, [title, buildPayload, createGoal, refineGoal]);

  const handleCloseRefinementModal = useCallback(() => {
    setShowRefinementModal(false);
    setRefinementSuggestions(null);
    setRefinementError(null);

    // If we created a goal, navigate to it
    if (createdGoalId) {
      router.replace(`/goal/${createdGoalId}`);
    }
  }, [createdGoalId, router]);

  const handleApplySuggestions = useCallback(
    (suggestions: Partial<SmartSuggestions>) => {
      // Apply suggestions to local form state
      if (suggestions.specific) setSpecific(suggestions.specific);
      if (suggestions.measurable) setMeasurable(suggestions.measurable);
      if (suggestions.achievable) setAchievable(suggestions.achievable);
      if (suggestions.relevant) setRelevant(suggestions.relevant);
      if (suggestions.time_bound) setTimeBound(suggestions.time_bound);

      // Navigate to the created goal to see the full details
      if (createdGoalId) {
        // The goal was already created, navigate to its detail page
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace(`/goal/${createdGoalId}`);
      }
    },
    [createdGoalId, router]
  );

  const isFormValid = title.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Goal</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.titleInput, titleError && styles.inputError]}
              placeholder="What do you want to achieve?"
              placeholderTextColor={COLORS.textTertiary}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (titleError) setTitleError(null);
              }}
              maxLength={200}
              returnKeyType="next"
            />
            {titleError && <Text style={styles.errorText}>{titleError}</Text>}
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description (Optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add more details about your goal..."
              placeholderTextColor={COLORS.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={1000}
            />
          </View>

          {/* Time Scale */}
          <TimeScaleControl value={timeScale} onChange={setTimeScale} />

          {/* Due Date */}
          <DatePickerSection value={dueDate} onChange={setDueDate} />

          {/* Visibility */}
          <VisibilityPicker value={visibility} onChange={setVisibility} />

          {/* Assignees */}
          <AssigneeSelect
            members={familyMembers}
            selectedIds={assigneeIds}
            onChange={setAssigneeIds}
            isLoading={membersLoading}
          />

          {/* Refine with AI Button */}
          <TouchableOpacity
            style={[
              styles.refineButton,
              (!title.trim() || isRefining) && styles.refineButtonDisabled,
            ]}
            onPress={handleRefineWithAI}
            activeOpacity={0.7}
            disabled={!title.trim() || isRefining}
          >
            {isRefining ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color={COLORS.primary} />
                <Text style={styles.refineButtonText}>
                  Create & Refine with AI
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Show SMART fields if any are populated */}
          {(specific || measurable || achievable || relevant || timeBound) && (
            <View style={styles.smartFieldsSection}>
              <Text style={styles.smartFieldsTitle}>
                SMART Fields (AI Suggested)
              </Text>
              {specific && (
                <View style={styles.smartFieldItem}>
                  <Text style={styles.smartFieldLabel}>Specific</Text>
                  <Text style={styles.smartFieldValue}>{specific}</Text>
                </View>
              )}
              {measurable && (
                <View style={styles.smartFieldItem}>
                  <Text style={styles.smartFieldLabel}>Measurable</Text>
                  <Text style={styles.smartFieldValue}>{measurable}</Text>
                </View>
              )}
              {achievable && (
                <View style={styles.smartFieldItem}>
                  <Text style={styles.smartFieldLabel}>Achievable</Text>
                  <Text style={styles.smartFieldValue}>{achievable}</Text>
                </View>
              )}
              {relevant && (
                <View style={styles.smartFieldItem}>
                  <Text style={styles.smartFieldLabel}>Relevant</Text>
                  <Text style={styles.smartFieldValue}>{relevant}</Text>
                </View>
              )}
              {timeBound && (
                <View style={styles.smartFieldItem}>
                  <Text style={styles.smartFieldLabel}>Time-bound</Text>
                  <Text style={styles.smartFieldValue}>{timeBound}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Create Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (!isFormValid || createGoal.isPending || isRefining) &&
                styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!isFormValid || createGoal.isPending || isRefining}
            activeOpacity={0.8}
          >
            {createGoal.isPending ? (
              <ActivityIndicator size="small" color={COLORS.textOnPrimary} />
            ) : (
              <>
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={COLORS.textOnPrimary}
                />
                <Text style={styles.createButtonText}>Create Goal</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* AI Refinement Modal */}
      <AIRefinementModal
        visible={showRefinementModal}
        isLoading={isRefining}
        suggestions={refinementSuggestions}
        currentValues={{
          title: title,
          description: description,
          specific: specific,
          measurable: measurable,
          achievable: achievable,
          relevant: relevant,
          time_bound: timeBound,
        }}
        onApplySuggestions={handleApplySuggestions}
        onClose={handleCloseRefinementModal}
        error={refinementError}
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
  keyboardView: {
    flex: 1,
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
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },

  // Title input
  titleInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
  },

  // Description input
  descriptionInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
  },

  // Time scale
  timeScaleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  timeScaleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeScaleButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeScaleText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  timeScaleTextSelected: {
    color: COLORS.textOnPrimary,
  },

  // Date picker
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  datePickerPlaceholder: {
    color: COLORS.textTertiary,
  },

  // Visibility
  visibilityContainer: {
    gap: 8,
  },
  visibilityOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  visibilityOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "08",
  },
  visibilityRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  visibilityRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  visibilityTextContainer: {
    flex: 1,
  },
  visibilityLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 2,
  },
  visibilityLabelSelected: {
    color: COLORS.primary,
  },
  visibilityDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Assignees
  assigneeLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  assigneeLoadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  assigneesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  assigneeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  assigneeItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  assigneeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  assigneeAvatarSelected: {
    backgroundColor: COLORS.primary,
  },
  assigneeAvatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },
  assigneeName: {
    fontSize: 14,
    color: COLORS.text,
    maxWidth: 100,
  },
  assigneeNameSelected: {
    fontWeight: "500",
  },

  // Refine button
  refineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    paddingVertical: 14,
    marginTop: 8,
  },
  refineButtonDisabled: {
    borderColor: COLORS.border,
    opacity: 0.6,
  },
  refineButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.primary,
  },

  // SMART fields display
  smartFieldsSection: {
    marginTop: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  smartFieldsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  smartFieldItem: {
    marginBottom: 12,
  },
  smartFieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 4,
  },
  smartFieldValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.primary + "60",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },
});
