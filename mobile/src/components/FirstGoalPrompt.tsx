import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import { Button, Card, PressableCard } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

interface FirstGoalPromptResponse {
  eligible: boolean;
  suggestions?: GoalSuggestion[];
}

interface GoalSuggestion {
  id: string;
  title: string;
  description?: string;
}

interface CreateGoalResponse {
  id: number;
  title: string;
}

interface FirstGoalPromptProps {
  visible: boolean;
  onClose: () => void;
  onGoalCreated?: (goalId: number) => void;
}

export function FirstGoalPrompt({
  visible,
  onClose,
  onGoalCreated,
}: FirstGoalPromptProps) {
  const { currentFamilyId } = useAuthStore();
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(
    null
  );
  const [customGoal, setCustomGoal] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!currentFamilyId) return;

    try {
      setIsLoading(true);
      const response = await api.get<FirstGoalPromptResponse>(
        "/users/me/first_goal_prompt"
      );

      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      } else {
        // Default suggestions if API doesn't provide any
        setSuggestions([
          {
            id: "default-1",
            title: "Complete a daily planning session each morning",
            description: "Build a consistent morning planning habit",
          },
          {
            id: "default-2",
            title: "Exercise for 30 minutes, 3 times per week",
            description: "Improve physical health and energy levels",
          },
          {
            id: "default-3",
            title: "Read for 20 minutes before bed",
            description: "Wind down and learn something new each day",
          },
        ]);
      }
    } catch {
      // Use default suggestions on error
      setSuggestions([
        {
          id: "default-1",
          title: "Complete a daily planning session each morning",
          description: "Build a consistent morning planning habit",
        },
        {
          id: "default-2",
          title: "Exercise for 30 minutes, 3 times per week",
          description: "Improve physical health and energy levels",
        },
        {
          id: "default-3",
          title: "Read for 20 minutes before bed",
          description: "Wind down and learn something new each day",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [currentFamilyId]);

  useEffect(() => {
    if (visible) {
      fetchSuggestions();
    }
  }, [visible, fetchSuggestions]);

  const handleSelectSuggestion = (id: string) => {
    setSelectedSuggestion(id === selectedSuggestion ? null : id);
    setIsCustomMode(false);
    setCustomGoal("");
  };

  const handleCustomMode = () => {
    setIsCustomMode(true);
    setSelectedSuggestion(null);
  };

  const handleBackToSuggestions = () => {
    setIsCustomMode(false);
    setCustomGoal("");
  };

  const handleCreateGoal = async () => {
    if (!currentFamilyId) {
      Alert.alert("Error", "No family selected. Please set up your family first.");
      return;
    }

    let goalTitle = "";
    let goalDescription = "";

    if (isCustomMode) {
      if (!customGoal.trim()) {
        Alert.alert("Error", "Please enter a goal title.");
        return;
      }
      goalTitle = customGoal.trim();
    } else if (selectedSuggestion) {
      const suggestion = suggestions.find((s) => s.id === selectedSuggestion);
      if (suggestion) {
        goalTitle = suggestion.title;
        goalDescription = suggestion.description || "";
      }
    } else {
      Alert.alert("Error", "Please select a goal or write your own.");
      return;
    }

    try {
      setIsCreating(true);
      const response = await api.post<CreateGoalResponse>(
        `/families/${currentFamilyId}/goals`,
        {
          goal: {
            title: goalTitle,
            description: goalDescription,
            time_scale: "weekly",
            status: "not_started",
            visibility: "personal",
          },
        }
      );

      if (onGoalCreated) {
        onGoalCreated(response.id);
      }

      Alert.alert(
        "Goal Created!",
        "Great start! You can view and track your goal in the Goals tab.",
        [{ text: "OK", onPress: onClose }]
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create goal";
      Alert.alert("Error", message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDismiss = async () => {
    try {
      setIsDismissing(true);
      await api.post("/users/me/first_goal_prompt/dismiss");
      onClose();
    } catch {
      // Close modal even if dismiss API fails
      onClose();
    } finally {
      setIsDismissing(false);
    }
  };

  const canCreate =
    (isCustomMode && customGoal.trim().length > 0) ||
    (!isCustomMode && selectedSuggestion !== null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={handleDismiss}
                disabled={isDismissing}
                style={styles.dismissButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.headerCenter}>
              <View style={styles.iconContainer}>
                <Ionicons name="flag" size={28} color={COLORS.primary} />
              </View>
            </View>
            <View style={styles.headerRight} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Set Your First Goal</Text>
            <Text style={styles.subtitle}>
              Goals help you stay focused and track your progress. Choose one
              below or create your own.
            </Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading suggestions...</Text>
              </View>
            ) : isCustomMode ? (
              /* Custom Goal Input */
              <View style={styles.customGoalContainer}>
                <TouchableOpacity
                  onPress={handleBackToSuggestions}
                  style={styles.backButton}
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.backButtonText}>Back to suggestions</Text>
                </TouchableOpacity>

                <Text style={styles.customLabel}>Write your goal</Text>
                <TextInput
                  style={styles.customInput}
                  placeholder="What do you want to achieve?"
                  placeholderTextColor={COLORS.textTertiary}
                  value={customGoal}
                  onChangeText={setCustomGoal}
                  multiline
                  maxLength={200}
                  textAlignVertical="top"
                  autoFocus
                />
                <Text style={styles.charCount}>
                  {customGoal.length}/200 characters
                </Text>
              </View>
            ) : (
              /* Suggestions List */
              <View style={styles.suggestionsContainer}>
                {suggestions.map((suggestion) => (
                  <PressableCard
                    key={suggestion.id}
                    variant={
                      selectedSuggestion === suggestion.id
                        ? "elevated"
                        : "outlined"
                    }
                    padding="medium"
                    style={[
                      styles.suggestionCard,
                      selectedSuggestion === suggestion.id &&
                        styles.selectedCard,
                    ]}
                    onPress={() => handleSelectSuggestion(suggestion.id)}
                  >
                    <View style={styles.suggestionContent}>
                      <View style={styles.suggestionHeader}>
                        <View
                          style={[
                            styles.radioCircle,
                            selectedSuggestion === suggestion.id &&
                              styles.radioCircleSelected,
                          ]}
                        >
                          {selectedSuggestion === suggestion.id && (
                            <View style={styles.radioInner} />
                          )}
                        </View>
                        <Text style={styles.suggestionTitle}>
                          {suggestion.title}
                        </Text>
                      </View>
                      {suggestion.description && (
                        <Text style={styles.suggestionDescription}>
                          {suggestion.description}
                        </Text>
                      )}
                    </View>
                  </PressableCard>
                ))}

                {/* Custom Goal Option */}
                <TouchableOpacity
                  style={styles.customOption}
                  onPress={handleCustomMode}
                >
                  <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.customOptionText}>
                    Write your own goal
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={handleCreateGoal}
              disabled={!canCreate || isCreating}
              loading={isCreating}
            >
              Create Goal
            </Button>
            <TouchableOpacity
              onPress={handleDismiss}
              disabled={isDismissing}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>
                {isDismissing ? "Dismissing..." : "Maybe later"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// Hook to check first goal prompt eligibility
export function useFirstGoalPrompt() {
  const { currentFamilyId, isAuthenticated } = useAuthStore();
  const [isEligible, setIsEligible] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkEligibility = useCallback(async () => {
    if (!isAuthenticated || !currentFamilyId) {
      setIsEligible(false);
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);
      const response = await api.get<FirstGoalPromptResponse>(
        "/users/me/first_goal_prompt"
      );
      setIsEligible(response.eligible);
    } catch {
      setIsEligible(false);
    } finally {
      setIsChecking(false);
    }
  }, [isAuthenticated, currentFamilyId]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const dismiss = useCallback(() => {
    setIsEligible(false);
  }, []);

  return {
    isEligible,
    isChecking,
    checkEligibility,
    dismiss,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 40,
  },
  dismissButton: {
    padding: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  suggestionsContainer: {
    gap: 12,
  },
  suggestionCard: {
    marginBottom: 0,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  suggestionContent: {
    gap: 8,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  suggestionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 22,
  },
  suggestionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 34,
    lineHeight: 20,
  },
  customOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceVariant,
  },
  customOptionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "500",
  },
  customGoalContainer: {
    gap: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  customLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  customInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: "right",
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
