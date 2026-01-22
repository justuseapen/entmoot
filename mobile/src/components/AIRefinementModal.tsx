import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/theme/colors";
import type {
  SmartSuggestions,
  GoalRefinementResponse,
} from "@/hooks/useGoals";

// ============================================================================
// Types
// ============================================================================

interface AIRefinementModalProps {
  visible: boolean;
  isLoading: boolean;
  suggestions: GoalRefinementResponse["suggestions"] | null;
  currentValues: {
    title: string;
    description: string;
    specific: string | null;
    measurable: string | null;
    achievable: string | null;
    relevant: string | null;
    time_bound: string | null;
  };
  onApplySuggestions: (suggestions: Partial<SmartSuggestions>) => void;
  onClose: () => void;
  error?: string | null;
}

interface SmartFieldConfig {
  key: keyof SmartSuggestions;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

// ============================================================================
// Constants
// ============================================================================

const SMART_FIELDS: SmartFieldConfig[] = [
  {
    key: "specific",
    label: "Specific",
    icon: "bullseye-outline" as keyof typeof Ionicons.glyphMap,
    description: "What exactly do you want to accomplish?",
  },
  {
    key: "measurable",
    label: "Measurable",
    icon: "analytics-outline",
    description: "How will you measure progress?",
  },
  {
    key: "achievable",
    label: "Achievable",
    icon: "checkmark-done-outline",
    description: "Is this goal realistic?",
  },
  {
    key: "relevant",
    label: "Relevant",
    icon: "compass-outline",
    description: "Why does this matter to you?",
  },
  {
    key: "time_bound",
    label: "Time-bound",
    icon: "time-outline",
    description: "When will you achieve this?",
  },
];

// ============================================================================
// Smart Field Item Component
// ============================================================================

interface SmartFieldItemProps {
  config: SmartFieldConfig;
  currentValue: string | null;
  suggestedValue: string | null;
  isAccepted: boolean;
  onToggle: () => void;
}

function SmartFieldItem({
  config,
  currentValue,
  suggestedValue,
  isAccepted,
  onToggle,
}: SmartFieldItemProps) {
  const hasSuggestion = !!suggestedValue;
  const isImprovement = hasSuggestion && suggestedValue !== currentValue;

  if (!isImprovement) {
    return null;
  }

  return (
    <View style={styles.fieldItem}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldTitleRow}>
          <Ionicons name={config.icon} size={20} color={COLORS.primary} />
          <Text style={styles.fieldLabel}>{config.label}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isAccepted && styles.toggleButtonAccepted,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle();
          }}
        >
          <Ionicons
            name={isAccepted ? "checkmark-circle" : "add-circle-outline"}
            size={24}
            color={isAccepted ? COLORS.success : COLORS.primary}
          />
          <Text
            style={[
              styles.toggleButtonText,
              isAccepted && styles.toggleButtonTextAccepted,
            ]}
          >
            {isAccepted ? "Accepted" : "Accept"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldDescription}>{config.description}</Text>

      {currentValue && (
        <View style={styles.valueContainer}>
          <Text style={styles.valueLabel}>Current:</Text>
          <Text style={styles.currentValue}>{currentValue}</Text>
        </View>
      )}

      <View style={[styles.valueContainer, styles.suggestedValueContainer]}>
        <Text style={styles.valueLabel}>
          <Ionicons name="sparkles" size={12} color={COLORS.primary} />{" "}
          Suggested:
        </Text>
        <Text style={styles.suggestedValue}>{suggestedValue}</Text>
      </View>
    </View>
  );
}

// ============================================================================
// Loading State Component
// ============================================================================

function LoadingState() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIconContainer}>
        <Ionicons name="sparkles" size={48} color={COLORS.primary} />
      </View>
      <Text style={styles.loadingTitle}>AI is thinking...</Text>
      <Text style={styles.loadingSubtitle}>
        Analyzing your goal and generating SMART suggestions
      </Text>
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={styles.loadingSpinner}
      />
    </View>
  );
}

// ============================================================================
// Error State Component
// ============================================================================

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  onClose: () => void;
}

function ErrorState({ message, onClose }: ErrorStateProps) {
  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        <Ionicons name="alert-circle" size={48} color={COLORS.error} />
      </View>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <TouchableOpacity style={styles.errorButton} onPress={onClose}>
        <Text style={styles.errorButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AIRefinementModal({
  visible,
  isLoading,
  suggestions,
  currentValues,
  onApplySuggestions,
  onClose,
  error,
}: AIRefinementModalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["90%"], []);

  // Track which suggestions are accepted
  const [acceptedFields, setAcceptedFields] = useState<
    Set<keyof SmartSuggestions>
  >(new Set());

  // Reset accepted fields when modal opens with new suggestions
  useEffect(() => {
    if (visible && suggestions) {
      setAcceptedFields(new Set());
    }
  }, [visible, suggestions]);

  // Open/close the bottom sheet based on visibility
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
    onClose();
  }, [onClose]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const toggleField = useCallback((field: keyof SmartSuggestions) => {
    setAcceptedFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  }, []);

  const handleAcceptAll = useCallback(() => {
    if (!suggestions?.smart_suggestions) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Add all fields that have suggestions
    const fieldsToAccept = new Set<keyof SmartSuggestions>();
    SMART_FIELDS.forEach((field) => {
      const suggestedValue = suggestions.smart_suggestions[field.key];
      const currentValue = currentValues[field.key];
      if (suggestedValue && suggestedValue !== currentValue) {
        fieldsToAccept.add(field.key);
      }
    });

    setAcceptedFields(fieldsToAccept);
  }, [suggestions, currentValues]);

  const handleApply = useCallback(() => {
    if (!suggestions?.smart_suggestions) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Build object with only accepted suggestions
    const acceptedSuggestions: Partial<SmartSuggestions> = {};
    acceptedFields.forEach((field) => {
      const value = suggestions.smart_suggestions[field];
      if (value) {
        acceptedSuggestions[field] = value;
      }
    });

    onApplySuggestions(acceptedSuggestions);
    handleClose();
  }, [suggestions, acceptedFields, onApplySuggestions, handleClose]);

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

  // Count suggestions with improvements
  const suggestionsCount = useMemo(() => {
    if (!suggestions?.smart_suggestions) return 0;
    return SMART_FIELDS.filter((field) => {
      const suggestedValue = suggestions.smart_suggestions[field.key];
      const currentValue = currentValues[field.key];
      return suggestedValue && suggestedValue !== currentValue;
    }).length;
  }, [suggestions, currentValues]);

  if (!visible) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.bottomSheetBackground}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="sparkles" size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>AI Suggestions</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onClose={handleClose} />
      ) : suggestions ? (
        <>
          <BottomSheetScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Overall Feedback */}
            {suggestions.overall_feedback && (
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackText}>
                  {suggestions.overall_feedback}
                </Text>
              </View>
            )}

            {/* SMART Suggestions */}
            <View style={styles.smartSuggestionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SMART Breakdown</Text>
                {suggestionsCount > 0 && (
                  <TouchableOpacity
                    style={styles.acceptAllButton}
                    onPress={handleAcceptAll}
                  >
                    <Text style={styles.acceptAllText}>Accept All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {suggestionsCount === 0 ? (
                <Text style={styles.noSuggestionsText}>
                  Your goal is already well-structured! No additional SMART
                  suggestions needed.
                </Text>
              ) : (
                SMART_FIELDS.map((field) => (
                  <SmartFieldItem
                    key={field.key}
                    config={field}
                    currentValue={currentValues[field.key]}
                    suggestedValue={suggestions.smart_suggestions[field.key]}
                    isAccepted={acceptedFields.has(field.key)}
                    onToggle={() => toggleField(field.key)}
                  />
                ))
              )}
            </View>

            {/* Alternative Titles */}
            {suggestions.alternative_titles?.length > 0 && (
              <View style={styles.alternativesSection}>
                <Text style={styles.sectionTitle}>Alternative Titles</Text>
                {suggestions.alternative_titles.map((title, index) => (
                  <View key={index} style={styles.alternativeItem}>
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.alternativeText}>{title}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Potential Obstacles */}
            {suggestions.potential_obstacles?.length > 0 && (
              <View style={styles.obstaclesSection}>
                <Text style={styles.sectionTitle}>Potential Obstacles</Text>
                {suggestions.potential_obstacles.map((item, index) => (
                  <View key={index} style={styles.obstacleItem}>
                    <View style={styles.obstacleHeader}>
                      <Ionicons
                        name="warning-outline"
                        size={16}
                        color={COLORS.warning}
                      />
                      <Text style={styles.obstacleText}>{item.obstacle}</Text>
                    </View>
                    {item.mitigation && (
                      <View style={styles.mitigationContainer}>
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={14}
                          color={COLORS.success}
                        />
                        <Text style={styles.mitigationText}>
                          {item.mitigation}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Milestones */}
            {suggestions.milestones?.length > 0 && (
              <View style={styles.milestonesSection}>
                <Text style={styles.sectionTitle}>Suggested Milestones</Text>
                {suggestions.milestones.map((milestone, index) => (
                  <View key={index} style={styles.milestoneItem}>
                    <View style={styles.milestoneProgress}>
                      <Text style={styles.milestoneProgressText}>
                        {milestone.suggested_progress}%
                      </Text>
                    </View>
                    <View style={styles.milestoneContent}>
                      <Text style={styles.milestoneTitle}>
                        {milestone.title}
                      </Text>
                      {milestone.description && (
                        <Text style={styles.milestoneDescription}>
                          {milestone.description}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </BottomSheetScrollView>

          {/* Footer */}
          {acceptedFields.size > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={COLORS.textOnPrimary}
                />
                <Text style={styles.applyButtonText}>
                  Apply {acceptedFields.size} Suggestion
                  {acceptedFields.size > 1 ? "s" : ""}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : null}
    </BottomSheet>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: COLORS.background,
  },
  handleIndicator: {
    backgroundColor: COLORS.border,
    width: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },

  // Scroll content
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // Feedback
  feedbackContainer: {
    backgroundColor: COLORS.primary + "10",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  feedbackText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },

  // Section styles
  smartSuggestionsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  acceptAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.primary + "15",
  },
  acceptAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  noSuggestionsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    padding: 20,
  },

  // Field item
  fieldItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  fieldTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  fieldDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.primary + "10",
  },
  toggleButtonAccepted: {
    backgroundColor: COLORS.success + "15",
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.primary,
  },
  toggleButtonTextAccepted: {
    color: COLORS.success,
  },

  // Value containers
  valueContainer: {
    marginTop: 8,
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  suggestedValueContainer: {
    backgroundColor: COLORS.primary + "08",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  suggestedValue: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },

  // Alternatives section
  alternativesSection: {
    marginBottom: 24,
  },
  alternativeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginTop: 8,
  },
  alternativeText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },

  // Obstacles section
  obstaclesSection: {
    marginBottom: 24,
  },
  obstacleItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  obstacleHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  obstacleText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  mitigationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  mitigationText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Milestones section
  milestonesSection: {
    marginBottom: 24,
  },
  milestoneItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  milestoneProgress: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneProgressText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
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
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  loadingSpinner: {
    marginTop: 8,
  },

  // Error state
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.error + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
  },
});
