import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import type { MainTabScreenProps } from "../../navigation/types";
import type { Goal, Family } from "@shared/types";
import { getFamilies } from "../../lib/families";
import {
  getLinkableGoals,
  formatTimeScale,
  getStatusColor,
} from "../../lib/goals";
import {
  getTodaysPlan,
  updateDailyPlan,
  formatTodayDate,
  type DailyPlanWithStats,
  type DailyTaskWithGoal,
  type TopPriorityWithGoal,
  type DailyTaskAttributes,
  type TopPriorityAttributes,
} from "../../lib/dailyPlans";

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

type Props = MainTabScreenProps<"DailyPlanner">;

type SaveStatus = "idle" | "saving" | "saved";

// Helper to ensure we always have 3 priority slots
const ensureThreePriorities = (
  existingPriorities: TopPriorityWithGoal[]
): TopPriorityWithGoal[] => {
  const result = [...existingPriorities];
  while (result.length < 3) {
    result.push({
      id: 0,
      title: "",
      position: result.length,
      goal_id: null,
      goal: null,
      created_at: "",
      updated_at: "",
    });
  }
  return result.slice(0, 3);
};

export function DailyPlannerScreen(_props: Props) {
  // Note: navigation and user are available through props and store if needed
  void _props;
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamilyId, setCurrentFamilyId] = useState<number | null>(null);
  const [plan, setPlan] = useState<DailyPlanWithStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Local state for edits
  const [intention, setIntention] = useState("");
  const [tasks, setTasks] = useState<DailyTaskWithGoal[]>([]);
  const [priorities, setPriorities] = useState<TopPriorityWithGoal[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Modal states
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [goalPickerTarget, setGoalPickerTarget] = useState<{
    type: "task" | "priority";
    index: number;
  } | null>(null);
  const [showFamilySwitcher, setShowFamilySwitcher] = useState(false);

  // Debounce timer ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial data
  const loadData = useCallback(async (familyId?: number) => {
    try {
      // Load families first if not provided
      let targetFamilyId = familyId;
      if (!targetFamilyId) {
        const familiesRes = await getFamilies();
        setFamilies(familiesRes.families);
        targetFamilyId = familiesRes.families[0]?.id;
        if (targetFamilyId) {
          setCurrentFamilyId(targetFamilyId);
        }
      }

      if (!targetFamilyId) return;

      // Load plan and goals in parallel
      const [planRes, goalsRes] = await Promise.all([
        getTodaysPlan(targetFamilyId),
        getLinkableGoals(targetFamilyId),
      ]);

      setPlan(planRes);
      setGoals(goalsRes);

      // Initialize local state from plan
      setIntention(planRes.intention || "");
      setTasks(planRes.daily_tasks || []);
      setPriorities(ensureThreePriorities(planRes.top_priorities || []));
    } catch (error) {
      console.error("Failed to load daily planner data:", error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    load();

    // Cleanup timers on unmount
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    };
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData(currentFamilyId || undefined);
    setIsRefreshing(false);
  }, [loadData, currentFamilyId]);

  // Save changes with debounce
  const saveChanges = useCallback(
    async (
      newTasks?: DailyTaskWithGoal[],
      newPriorities?: TopPriorityWithGoal[],
      newIntention?: string
    ) => {
      if (!plan || !currentFamilyId) return;

      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Debounce for 2 seconds
      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus("saving");

        const tasksToSave = newTasks ?? tasks;
        const prioritiesToSave = newPriorities ?? priorities;
        const intentionToSave = newIntention ?? intention;

        const taskAttributes: DailyTaskAttributes[] = tasksToSave.map(
          (task, index) => ({
            id: task.id || undefined,
            title: task.title,
            completed: task.completed,
            position: index,
            goal_id: task.goal_id,
            _destroy: task._destroy,
          })
        );

        const priorityAttributes: TopPriorityAttributes[] = prioritiesToSave
          .filter((p) => p.title.trim() || p.id)
          .map((priority, index) => ({
            id: priority.id || undefined,
            title: priority.title,
            priority_order: index + 1,
            goal_id: priority.goal_id,
            _destroy: priority._destroy,
          }));

        try {
          const result = await updateDailyPlan(currentFamilyId, plan.id, {
            intention: intentionToSave || null,
            daily_tasks_attributes: taskAttributes,
            top_priorities_attributes: priorityAttributes,
          });

          // Update local state from server response
          setPlan(result.daily_plan);
          setTasks(result.daily_plan.daily_tasks);
          setPriorities(
            ensureThreePriorities(result.daily_plan.top_priorities)
          );
          setIntention(result.daily_plan.intention || "");

          // Show saved status
          setSaveStatus("saved");
          if (saveStatusTimerRef.current) {
            clearTimeout(saveStatusTimerRef.current);
          }
          saveStatusTimerRef.current = setTimeout(() => {
            setSaveStatus("idle");
          }, 2000);
        } catch (error) {
          console.error("Failed to save changes:", error);
          setSaveStatus("idle");
          Alert.alert(
            "Save Error",
            "Failed to save changes. Please try again."
          );
        }
      }, 2000);
    },
    [plan, currentFamilyId, tasks, priorities, intention]
  );

  // Task handlers
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: DailyTaskWithGoal = {
      id: 0,
      title: newTaskTitle.trim(),
      completed: false,
      position: tasks.length,
      goal_id: null,
      goal: null,
      created_at: "",
      updated_at: "",
    };

    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    setNewTaskTitle("");
    saveChanges(newTasks);
  };

  const handleToggleTask = (index: number) => {
    const newTasks = tasks.map((task, i) =>
      i === index ? { ...task, completed: !task.completed } : task
    );
    setTasks(newTasks);
    saveChanges(newTasks);
  };

  const handleRemoveTask = (index: number) => {
    const taskToRemove = tasks[index];
    if (taskToRemove.id) {
      // Mark for deletion on server
      const newTasks = tasks.map((task, i) =>
        i === index ? { ...task, _destroy: true } : task
      );
      setTasks(newTasks);
      saveChanges(newTasks);
    } else {
      // Just remove from local state
      const newTasks = tasks.filter((_, i) => i !== index);
      setTasks(newTasks);
      saveChanges(newTasks);
    }
  };

  const handleMoveTask = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= tasks.length) return;

    const newTasks = [...tasks];
    const [movedTask] = newTasks.splice(fromIndex, 1);
    newTasks.splice(toIndex, 0, movedTask);

    // Update positions
    const reorderedTasks = newTasks.map((task, index) => ({
      ...task,
      position: index,
    }));

    setTasks(reorderedTasks);
    saveChanges(reorderedTasks);
  };

  const handleLinkTaskToGoal = (index: number, goalId: number | null) => {
    const selectedGoal = goals.find((g) => g.id === goalId);
    const newTasks = tasks.map((task, i) =>
      i === index
        ? {
            ...task,
            goal_id: goalId,
            goal: selectedGoal
              ? {
                  id: selectedGoal.id,
                  title: selectedGoal.title,
                  time_scale: selectedGoal.time_scale,
                  status: selectedGoal.status,
                }
              : null,
          }
        : task
    );
    setTasks(newTasks);
    saveChanges(newTasks);
  };

  // Priority handlers
  const handlePriorityChange = (index: number, title: string) => {
    const newPriorities = priorities.map((p, i) =>
      i === index ? { ...p, title } : p
    );
    setPriorities(newPriorities);
  };

  const handlePriorityBlur = () => {
    saveChanges(undefined, priorities);
  };

  // Intention handlers
  const handleIntentionChange = (value: string) => {
    setIntention(value);
  };

  const handleIntentionBlur = () => {
    saveChanges(undefined, undefined, intention);
  };

  // Carry over yesterday's task
  const handleCarryOverTask = (task: DailyTaskWithGoal) => {
    const newTask: DailyTaskWithGoal = {
      id: 0,
      title: task.title,
      completed: false,
      position: tasks.length,
      goal_id: task.goal_id,
      goal: task.goal,
      created_at: "",
      updated_at: "",
    };
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    saveChanges(newTasks);
  };

  // Goal picker handlers
  const openGoalPicker = (type: "task" | "priority", index: number) => {
    setGoalPickerTarget({ type, index });
    setShowGoalPicker(true);
  };

  const handleGoalSelect = (goalId: number | null) => {
    if (!goalPickerTarget) return;

    if (goalPickerTarget.type === "task") {
      handleLinkTaskToGoal(goalPickerTarget.index, goalId);
    }
    // Could handle priority goal linking here too if needed

    setShowGoalPicker(false);
    setGoalPickerTarget(null);
  };

  // Family switcher
  const handleFamilySelect = async (familyId: number) => {
    setCurrentFamilyId(familyId);
    setShowFamilySwitcher(false);
    setIsLoading(true);
    await loadData(familyId);
    setIsLoading(false);
  };

  const currentFamily = families.find((f) => f.id === currentFamilyId);
  const visibleTasks = tasks.filter((t) => !t._destroy);
  const completionPercentage =
    visibleTasks.length > 0
      ? Math.round(
          (visibleTasks.filter((t) => t.completed).length /
            visibleTasks.length) *
            100
        )
      : 0;
  const yesterdayIncompleteTasks = plan?.yesterday_incomplete_tasks || [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.forestGreen} />
        <Text style={styles.loadingText}>Loading your daily plan...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load daily plan</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {families.length > 1 && (
            <TouchableOpacity
              style={styles.familySwitcherButton}
              onPress={() => setShowFamilySwitcher(true)}
            >
              <Text style={styles.familySwitcherText}>
                {currentFamily?.name || "Select Family"}
              </Text>
              <Text style={styles.familySwitcherIcon}>▼</Text>
            </TouchableOpacity>
          )}
          {families.length === 1 && currentFamily && (
            <View style={styles.familyBadge}>
              <Text style={styles.familyBadgeText}>{currentFamily.name}</Text>
            </View>
          )}
        </View>
        <Text style={styles.dateText}>{formatTodayDate()}</Text>
        <Text style={styles.subtitle}>Start your day with intention</Text>
      </View>

      {/* Save Status Bar */}
      <View style={styles.saveStatusBar}>
        <View style={styles.saveStatusLeft}>
          {saveStatus === "saving" && (
            <>
              <ActivityIndicator size="small" color={COLORS.skyBlue} />
              <Text style={[styles.saveStatusText, { color: COLORS.skyBlue }]}>
                Saving...
              </Text>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Text style={styles.checkIcon}>✓</Text>
              <Text
                style={[styles.saveStatusText, { color: COLORS.leafGreen }]}
              >
                Saved
              </Text>
            </>
          )}
          {saveStatus === "idle" && (
            <>
              <Text style={styles.checkIcon}>✓</Text>
              <Text
                style={[styles.saveStatusText, { color: COLORS.earthBrown }]}
              >
                All changes saved
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Progress Indicator */}
      {visibleTasks.length > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressIcon}>✅</Text>
            <Text style={styles.progressTitle}>Today&apos;s Progress</Text>
            <Text style={styles.progressCount}>
              {visibleTasks.filter((t) => t.completed).length} of{" "}
              {visibleTasks.length} tasks
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${completionPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {completionPercentage}% complete
          </Text>
        </View>
      )}

      {/* Top 3 Priorities */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🎯</Text>
          <Text style={styles.sectionTitle}>Top 3 Priorities</Text>
        </View>
        <View style={styles.prioritiesContainer}>
          {priorities.map((priority, index) => (
            <View key={index} style={styles.priorityItem}>
              <View style={styles.priorityNumber}>
                <Text style={styles.priorityNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={styles.priorityInput}
                placeholder={`Priority ${index + 1}`}
                placeholderTextColor={`${COLORS.earthBrown}60`}
                value={priority.title}
                onChangeText={(text) => handlePriorityChange(index, text)}
                onBlur={handlePriorityBlur}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Daily Intention */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>✨</Text>
          <Text style={styles.sectionTitle}>Daily Intention</Text>
        </View>
        <TextInput
          style={styles.intentionInput}
          placeholder="What's your intention for today? How do you want to show up?"
          placeholderTextColor={`${COLORS.earthBrown}60`}
          value={intention}
          onChangeText={handleIntentionChange}
          onBlur={handleIntentionBlur}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Yesterday's Incomplete Tasks */}
      {yesterdayIncompleteTasks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚠️</Text>
            <Text style={styles.sectionTitle}>
              Yesterday&apos;s Unfinished Tasks
            </Text>
          </View>
          <View style={styles.yesterdayContainer}>
            {yesterdayIncompleteTasks.map((task) => (
              <View key={task.id} style={styles.yesterdayItem}>
                <Text style={styles.yesterdayTaskTitle}>{task.title}</Text>
                <TouchableOpacity
                  style={styles.carryOverButton}
                  onPress={() => handleCarryOverTask(task)}
                >
                  <Text style={styles.carryOverButtonText}>Carry over →</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Today's Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>☑️</Text>
          <Text style={styles.sectionTitle}>Today&apos;s Tasks</Text>
        </View>

        {/* Add Task Input */}
        <View style={styles.addTaskContainer}>
          <TextInput
            style={styles.addTaskInput}
            placeholder="Add a new task..."
            placeholderTextColor={`${COLORS.earthBrown}60`}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            onSubmitEditing={handleAddTask}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.addTaskButton,
              !newTaskTitle.trim() && styles.addTaskButtonDisabled,
            ]}
            onPress={handleAddTask}
            disabled={!newTaskTitle.trim()}
          >
            <Text style={styles.addTaskButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        {visibleTasks.length > 0 ? (
          <View style={styles.taskList}>
            {visibleTasks.map((task, index) => (
              <View key={task.id || `new-${index}`} style={styles.taskItem}>
                <View style={styles.taskLeft}>
                  {/* Reorder buttons */}
                  <View style={styles.reorderButtons}>
                    <TouchableOpacity
                      style={[
                        styles.reorderButton,
                        index === 0 && styles.reorderButtonDisabled,
                      ]}
                      onPress={() => handleMoveTask(index, "up")}
                      disabled={index === 0}
                    >
                      <Text style={styles.reorderButtonText}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.reorderButton,
                        index === visibleTasks.length - 1 &&
                          styles.reorderButtonDisabled,
                      ]}
                      onPress={() => handleMoveTask(index, "down")}
                      disabled={index === visibleTasks.length - 1}
                    >
                      <Text style={styles.reorderButtonText}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Checkbox */}
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      task.completed && styles.checkboxChecked,
                    ]}
                    onPress={() => handleToggleTask(index)}
                  >
                    {task.completed && (
                      <Text style={styles.checkboxIcon}>✓</Text>
                    )}
                  </TouchableOpacity>

                  {/* Task content */}
                  <View style={styles.taskContent}>
                    <Text
                      style={[
                        styles.taskTitle,
                        task.completed && styles.taskTitleCompleted,
                      ]}
                    >
                      {task.title}
                    </Text>
                    {task.goal && (
                      <View style={styles.taskGoalBadge}>
                        <View
                          style={[
                            styles.taskGoalDot,
                            {
                              backgroundColor: getStatusColor(task.goal.status),
                            },
                          ]}
                        />
                        <Text style={styles.taskGoalText}>
                          {task.goal.title}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.taskActions}>
                  <TouchableOpacity
                    style={styles.linkGoalButton}
                    onPress={() => openGoalPicker("task", index)}
                  >
                    <Text style={styles.linkGoalButtonText}>
                      {task.goal ? "🔗" : "➕"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeTaskButton}
                    onPress={() => handleRemoveTask(index)}
                  >
                    <Text style={styles.removeTaskButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyTasks}>
            <Text style={styles.emptyTasksEmoji}>✅</Text>
            <Text style={styles.emptyTasksTitle}>No tasks yet</Text>
            <Text style={styles.emptyTasksText}>
              Add your first task above to start planning your day!
            </Text>
          </View>
        )}
      </View>

      {/* Goal Picker Modal */}
      <Modal
        visible={showGoalPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowGoalPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link to Goal</Text>
            <FlatList
              data={goals}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.goalItem}
                  onPress={() => handleGoalSelect(item.id)}
                >
                  <View style={styles.goalItemContent}>
                    <Text style={styles.goalItemTitle}>{item.title}</Text>
                    <View style={styles.goalItemMeta}>
                      <Text style={styles.goalItemTimeScale}>
                        {formatTimeScale(item.time_scale)}
                      </Text>
                      <View
                        style={[
                          styles.goalItemStatusDot,
                          { backgroundColor: getStatusColor(item.status) },
                        ]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyGoals}>
                  <Text style={styles.emptyGoalsText}>No active goals</Text>
                </View>
              }
              ListHeaderComponent={
                <TouchableOpacity
                  style={[styles.goalItem, styles.unlinkGoalItem]}
                  onPress={() => handleGoalSelect(null)}
                >
                  <Text style={styles.unlinkGoalText}>Remove link</Text>
                </TouchableOpacity>
              }
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGoalPicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Family Switcher Modal */}
      <Modal
        visible={showFamilySwitcher}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFamilySwitcher(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch Family</Text>
            <FlatList
              data={families}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.familyItem,
                    item.id === currentFamilyId && styles.familyItemSelected,
                  ]}
                  onPress={() => handleFamilySelect(item.id)}
                >
                  <Text
                    style={[
                      styles.familyItemText,
                      item.id === currentFamilyId &&
                        styles.familyItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.id === currentFamilyId && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFamilySwitcher(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.creamWhite,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.sunsetOrange,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.forestGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
  },
  familySwitcherButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.forestGreen}30`,
  },
  familySwitcherText: {
    fontSize: 14,
    color: COLORS.forestGreen,
    fontWeight: "500",
    marginRight: 4,
  },
  familySwitcherIcon: {
    fontSize: 10,
    color: COLORS.forestGreen,
  },
  familyBadge: {
    backgroundColor: `${COLORS.forestGreen}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  familyBadgeText: {
    fontSize: 14,
    color: COLORS.forestGreen,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.darkForest,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.earthBrown,
  },
  saveStatusBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  saveStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkIcon: {
    fontSize: 16,
    color: COLORS.leafGreen,
  },
  saveStatusText: {
    fontSize: 14,
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  progressIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  progressTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkForest,
  },
  progressCount: {
    fontSize: 13,
    color: COLORS.earthBrown,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: `${COLORS.earthBrown}20`,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.leafGreen,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 13,
    color: COLORS.earthBrown,
    textAlign: "center",
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkForest,
  },
  prioritiesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priorityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  priorityNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${COLORS.earthBrown}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  priorityNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.earthBrown,
  },
  priorityInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: `${COLORS.earthBrown}20`,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.darkForest,
  },
  intentionInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: COLORS.darkForest,
    minHeight: 80,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  yesterdayContainer: {
    backgroundColor: `${COLORS.warmGold}20`,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${COLORS.warmGold}50`,
  },
  yesterdayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  yesterdayTaskTitle: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkForest,
  },
  carryOverButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  carryOverButtonText: {
    fontSize: 14,
    color: COLORS.forestGreen,
    fontWeight: "500",
  },
  addTaskContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  addTaskInput: {
    flex: 1,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.darkForest,
    borderWidth: 1,
    borderColor: `${COLORS.earthBrown}20`,
  },
  addTaskButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.forestGreen,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addTaskButtonDisabled: {
    backgroundColor: `${COLORS.earthBrown}40`,
  },
  addTaskButtonText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  taskList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.earthBrown}10`,
  },
  taskLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  reorderButtons: {
    marginRight: 8,
  },
  reorderButton: {
    padding: 2,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  reorderButtonText: {
    fontSize: 10,
    color: COLORS.earthBrown,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.earthBrown,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.leafGreen,
    borderColor: COLORS.leafGreen,
  },
  checkboxIcon: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    color: COLORS.darkForest,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.earthBrown,
  },
  taskGoalBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  taskGoalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  taskGoalText: {
    fontSize: 12,
    color: COLORS.earthBrown,
  },
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkGoalButton: {
    padding: 8,
  },
  linkGoalButtonText: {
    fontSize: 16,
  },
  removeTaskButton: {
    padding: 8,
  },
  removeTaskButtonText: {
    fontSize: 20,
    color: COLORS.sunsetOrange,
    fontWeight: "bold",
  },
  emptyTasks: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTasksEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTasksTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkForest,
    marginBottom: 4,
  },
  emptyTasksText: {
    fontSize: 14,
    color: COLORS.earthBrown,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.creamWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.darkForest,
    marginBottom: 16,
    textAlign: "center",
  },
  goalItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  goalItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalItemTitle: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkForest,
  },
  goalItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goalItemTimeScale: {
    fontSize: 12,
    color: COLORS.earthBrown,
    backgroundColor: `${COLORS.earthBrown}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  goalItemStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unlinkGoalItem: {
    backgroundColor: `${COLORS.sunsetOrange}15`,
    borderWidth: 1,
    borderColor: `${COLORS.sunsetOrange}30`,
  },
  unlinkGoalText: {
    fontSize: 15,
    color: COLORS.sunsetOrange,
    textAlign: "center",
  },
  emptyGoals: {
    padding: 32,
    alignItems: "center",
  },
  emptyGoalsText: {
    fontSize: 14,
    color: COLORS.earthBrown,
  },
  familyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  familyItemSelected: {
    backgroundColor: `${COLORS.forestGreen}15`,
    borderWidth: 1,
    borderColor: COLORS.forestGreen,
  },
  familyItemText: {
    fontSize: 16,
    color: COLORS.darkForest,
  },
  familyItemTextSelected: {
    fontWeight: "600",
    color: COLORS.forestGreen,
  },
  checkmark: {
    fontSize: 18,
    color: COLORS.forestGreen,
    fontWeight: "bold",
  },
  modalCloseButton: {
    marginTop: 8,
    padding: 16,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 16,
    color: COLORS.earthBrown,
    fontWeight: "500",
  },
});
