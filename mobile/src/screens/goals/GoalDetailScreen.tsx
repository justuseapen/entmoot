import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import Slider from "@react-native-community/slider";
import type { RootStackScreenProps } from "../../navigation/types";
import type { Goal, GoalRefinementResponse } from "@shared/types";
import { useAuthStore } from "../../stores";
import { getFamilies } from "../../lib/families";
import {
  getGoal,
  updateGoal,
  deleteGoal,
  refineGoal,
  formatTimeScale,
  formatStatus,
  getStatusColor,
  formatDueDate,
  formatVisibility,
  getVisibilityEmoji,
  getTimeScaleEmoji,
} from "../../lib/goals";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  creamWhite: "#FFF8E7",
  earthBrown: "#795548",
  darkForest: "#1B3A1A",
  warmGold: "#FFD54F",
  skyBlue: "#64B5F6",
  sunsetOrange: "#FF7043",
};

type Props = RootStackScreenProps<"GoalDetail">;

// SMART Criterion display component
function SmartCriterion({
  label,
  value,
  suggestion,
  onAcceptSuggestion,
}: {
  label: string;
  value: string | null | undefined;
  suggestion?: string | null;
  onAcceptSuggestion?: (suggestion: string) => void;
}) {
  const hasValue = value && value.trim() !== "";
  const hasSuggestion = suggestion && suggestion.trim() !== "";

  return (
    <View style={styles.smartCriterion}>
      <View style={styles.smartHeader}>
        <Text style={styles.smartLabel}>{label}</Text>
        {hasValue && <Text style={styles.smartCheck}>✓</Text>}
      </View>
      <Text style={[styles.smartValue, !hasValue && styles.smartValueEmpty]}>
        {hasValue ? value : "Not defined yet"}
      </Text>
      {hasSuggestion && onAcceptSuggestion && (
        <View style={styles.suggestionContainer}>
          <Text style={styles.suggestionLabel}>AI Suggestion:</Text>
          <Text style={styles.suggestionText}>{suggestion}</Text>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => onAcceptSuggestion(suggestion)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export function GoalDetailScreen({ route, navigation }: Props) {
  const { goalId } = route.params;
  const { user } = useAuthStore();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [familyId, setFamilyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinement, setRefinement] = useState<GoalRefinementResponse | null>(
    null
  );
  const [localProgress, setLocalProgress] = useState(0);

  const loadGoal = useCallback(async () => {
    try {
      const familiesRes = await getFamilies();
      const fId = familiesRes.families[0]?.id;
      if (!fId) return;
      setFamilyId(fId);

      const loadedGoal = await getGoal(fId, parseInt(goalId, 10));
      setGoal(loadedGoal);
      setLocalProgress(loadedGoal.progress);
    } catch (error) {
      console.error("Failed to load goal:", error);
      Alert.alert("Error", "Failed to load goal details");
    }
  }, [goalId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadGoal();
      setIsLoading(false);
    };
    load();
  }, [loadGoal]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadGoal();
    setIsRefreshing(false);
  }, [loadGoal]);

  const handleProgressChange = async (value: number) => {
    if (!goal || !familyId || isUpdating) return;

    const newProgress = Math.round(value);
    setLocalProgress(newProgress);
  };

  const handleProgressComplete = async (value: number) => {
    if (!goal || !familyId || isUpdating) return;

    const newProgress = Math.round(value);
    setIsUpdating(true);

    try {
      const updated = await updateGoal(familyId, goal.id, {
        progress: newProgress,
      });
      setGoal(updated);
    } catch (error) {
      console.error("Failed to update progress:", error);
      setLocalProgress(goal.progress); // Revert
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefine = async () => {
    if (!goal || isRefining) return;

    setIsRefining(true);
    try {
      const result = await refineGoal(goal.id);
      setRefinement(result);
    } catch (error) {
      console.error("Failed to refine goal:", error);
      Alert.alert(
        "Error",
        "AI coaching is temporarily unavailable. Please try again later."
      );
    } finally {
      setIsRefining(false);
    }
  };

  const handleAcceptSuggestion = async (
    field: "specific" | "measurable" | "achievable" | "relevant" | "time_bound",
    value: string
  ) => {
    if (!goal || !familyId) return;

    setIsUpdating(true);
    try {
      const updated = await updateGoal(familyId, goal.id, { [field]: value });
      setGoal(updated);
      // Clear the accepted suggestion
      if (refinement) {
        setRefinement({
          ...refinement,
          smart_suggestions: {
            ...refinement.smart_suggestions,
            [field]: null,
          },
        });
      }
    } catch (error) {
      console.error("Failed to update goal:", error);
      Alert.alert("Error", "Failed to apply suggestion");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!goal || !familyId) return;
            try {
              await deleteGoal(familyId, goal.id);
              navigation.goBack();
            } catch (error) {
              console.error("Failed to delete goal:", error);
              Alert.alert("Error", "Failed to delete goal");
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate("EditGoal", { goalId: goalId });
  };

  if (isLoading || !goal) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.forestGreen} />
        <Text style={styles.loadingText}>Loading goal...</Text>
      </View>
    );
  }

  const statusColor = getStatusColor(goal.status);
  const isCreator = user?.id === goal.creator.id;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.forestGreen}
          colors={[COLORS.forestGreen]}
        />
      }
    >
      {/* Title and Status */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.timeScaleEmoji}>
            {getTimeScaleEmoji(goal.time_scale)}
          </Text>
          <Text style={styles.title}>{goal.title}</Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {formatStatus(goal.status)}
          </Text>
        </View>
      </View>

      {/* Description */}
      {goal.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{goal.description}</Text>
        </View>
      )}

      {/* Progress Slider */}
      <View style={styles.section}>
        <View style={styles.progressHeader}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <Text style={styles.progressValue}>{localProgress}%</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={localProgress}
          onValueChange={handleProgressChange}
          onSlidingComplete={handleProgressComplete}
          minimumTrackTintColor={COLORS.forestGreen}
          maximumTrackTintColor={`${COLORS.earthBrown}30`}
          thumbTintColor={COLORS.forestGreen}
          disabled={isUpdating}
        />
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>0%</Text>
          <Text style={styles.progressLabel}>100%</Text>
        </View>
      </View>

      {/* Meta Info */}
      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Time Scale</Text>
          <Text style={styles.metaValue}>
            {formatTimeScale(goal.time_scale)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Due Date</Text>
          <Text style={styles.metaValue}>{formatDueDate(goal.due_date)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Visibility</Text>
          <Text style={styles.metaValue}>
            {getVisibilityEmoji(goal.visibility)}{" "}
            {formatVisibility(goal.visibility)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Created by</Text>
          <Text style={styles.metaValue}>{goal.creator.name}</Text>
        </View>
      </View>

      {/* Assignees */}
      {goal.assignees && goal.assignees.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned to</Text>
          <View style={styles.assigneesList}>
            {goal.assignees.map((assignee) => (
              <View key={assignee.id} style={styles.assigneeChip}>
                <View style={styles.assigneeAvatar}>
                  <Text style={styles.assigneeInitial}>
                    {assignee.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.assigneeName}>{assignee.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* SMART Criteria */}
      <View style={styles.section}>
        <View style={styles.smartHeaderRow}>
          <Text style={styles.sectionTitle}>SMART Criteria</Text>
          <TouchableOpacity
            style={[
              styles.refineButton,
              isRefining && styles.refineButtonDisabled,
            ]}
            onPress={handleRefine}
            disabled={isRefining}
          >
            {isRefining ? (
              <ActivityIndicator size="small" color={COLORS.forestGreen} />
            ) : (
              <Text style={styles.refineButtonText}>✨ Refine with AI</Text>
            )}
          </TouchableOpacity>
        </View>

        {refinement?.overall_feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>AI Feedback</Text>
            <Text style={styles.feedbackText}>
              {refinement.overall_feedback}
            </Text>
          </View>
        )}

        <View style={styles.smartGrid}>
          <SmartCriterion
            label="Specific"
            value={goal.specific}
            suggestion={refinement?.smart_suggestions?.specific}
            onAcceptSuggestion={(s) => handleAcceptSuggestion("specific", s)}
          />
          <SmartCriterion
            label="Measurable"
            value={goal.measurable}
            suggestion={refinement?.smart_suggestions?.measurable}
            onAcceptSuggestion={(s) => handleAcceptSuggestion("measurable", s)}
          />
          <SmartCriterion
            label="Achievable"
            value={goal.achievable}
            suggestion={refinement?.smart_suggestions?.achievable}
            onAcceptSuggestion={(s) => handleAcceptSuggestion("achievable", s)}
          />
          <SmartCriterion
            label="Relevant"
            value={goal.relevant}
            suggestion={refinement?.smart_suggestions?.relevant}
            onAcceptSuggestion={(s) => handleAcceptSuggestion("relevant", s)}
          />
          <SmartCriterion
            label="Time-Bound"
            value={goal.time_bound}
            suggestion={refinement?.smart_suggestions?.time_bound}
            onAcceptSuggestion={(s) => handleAcceptSuggestion("time_bound", s)}
          />
        </View>
      </View>

      {/* AI Milestones */}
      {refinement?.milestones && refinement.milestones.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Milestones</Text>
          {refinement.milestones.map((milestone, index) => (
            <View key={index} style={styles.milestoneItem}>
              <View style={styles.milestoneDot} />
              <View style={styles.milestoneContent}>
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                {milestone.description && (
                  <Text style={styles.milestoneDescription}>
                    {milestone.description}
                  </Text>
                )}
                <Text style={styles.milestoneProgress}>
                  Target: {milestone.suggested_progress}% complete
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* AI Obstacles */}
      {refinement?.potential_obstacles &&
        refinement.potential_obstacles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Potential Obstacles</Text>
            {refinement.potential_obstacles.map((obstacle, index) => (
              <View key={index} style={styles.obstacleItem}>
                <Text style={styles.obstacleLabel}>⚠️ {obstacle.obstacle}</Text>
                <Text style={styles.obstacleMitigation}>
                  💡 {obstacle.mitigation}
                </Text>
              </View>
            ))}
          </View>
        )}

      {/* Parent Goal */}
      {goal.parent_id && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parent Goal</Text>
          <TouchableOpacity
            style={styles.parentGoalCard}
            onPress={() =>
              navigation.push("GoalDetail", {
                goalId: goal.parent_id!.toString(),
              })
            }
          >
            <Text style={styles.parentGoalText}>View Parent Goal →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>Edit Goal</Text>
        </TouchableOpacity>
        {isCreator && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.creamWhite,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.creamWhite,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.earthBrown,
  },
  header: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  timeScaleEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.darkForest,
    lineHeight: 30,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkForest,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: COLORS.earthBrown,
    lineHeight: 22,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.forestGreen,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.earthBrown,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metaItem: {
    width: "50%",
    marginBottom: 16,
  },
  metaLabel: {
    fontSize: 12,
    color: COLORS.earthBrown,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkForest,
  },
  assigneesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  assigneeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${COLORS.forestGreen}30`,
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.forestGreen,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  assigneeInitial: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  assigneeName: {
    fontSize: 14,
    color: COLORS.darkForest,
  },
  smartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  refineButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.warmGold}30`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refineButtonDisabled: {
    opacity: 0.6,
  },
  refineButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.darkForest,
  },
  feedbackContainer: {
    backgroundColor: `${COLORS.skyBlue}20`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.skyBlue,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.skyBlue,
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: COLORS.darkForest,
    lineHeight: 20,
  },
  smartGrid: {
    gap: 12,
  },
  smartCriterion: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  smartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  smartLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.forestGreen,
  },
  smartCheck: {
    fontSize: 14,
    color: COLORS.leafGreen,
  },
  smartValue: {
    fontSize: 14,
    color: COLORS.darkForest,
    lineHeight: 20,
  },
  smartValueEmpty: {
    color: `${COLORS.earthBrown}60`,
    fontStyle: "italic",
  },
  suggestionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.warmGold}40`,
    backgroundColor: `${COLORS.warmGold}10`,
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.warmGold,
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.darkForest,
    lineHeight: 20,
    marginBottom: 10,
  },
  acceptButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.forestGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  milestoneItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  milestoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.forestGreen,
    marginTop: 4,
    marginRight: 12,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkForest,
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 14,
    color: COLORS.earthBrown,
    marginBottom: 4,
  },
  milestoneProgress: {
    fontSize: 12,
    color: COLORS.forestGreen,
    fontWeight: "500",
  },
  obstacleItem: {
    backgroundColor: `${COLORS.sunsetOrange}10`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.sunsetOrange,
  },
  obstacleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkForest,
    marginBottom: 8,
  },
  obstacleMitigation: {
    fontSize: 14,
    color: COLORS.earthBrown,
    lineHeight: 20,
  },
  parentGoalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${COLORS.forestGreen}30`,
  },
  parentGoalText: {
    fontSize: 14,
    color: COLORS.forestGreen,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.forestGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.sunsetOrange,
    alignItems: "center",
  },
  deleteButtonText: {
    color: COLORS.sunsetOrange,
    fontSize: 16,
    fontWeight: "600",
  },
});
