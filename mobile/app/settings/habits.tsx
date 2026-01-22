import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/theme/colors";
import {
  useHabits,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useReorderHabits,
  type Habit,
} from "@/hooks";

const MAX_HABITS = 10;

interface HabitItemProps {
  habit: Habit;
  isEditing: boolean;
  editValue: string;
  onEditStart: (habit: Habit) => void;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onDelete: (habit: Habit) => void;
  drag: () => void;
  isActive: boolean;
}

function HabitItem({
  habit,
  isEditing,
  editValue,
  onEditStart,
  onEditChange,
  onEditSave,
  onDelete,
  drag,
  isActive,
}: HabitItemProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const inputRef = useRef<TextInput>(null);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Habit",
      `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            swipeableRef.current?.close();
            onDelete(habit);
          },
        },
      ]
    );
  }, [habit, onDelete]);

  const handleEditStart = useCallback(() => {
    onEditStart(habit);
    // Focus the input after state update
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [habit, onEditStart]);

  const renderRightActions = useCallback(
    (
      _progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>
    ) => {
      const scale = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [1, 0.5],
        extrapolate: "clamp",
      });

      return (
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteAction}
          activeOpacity={0.7}
        >
          <Animated.View
            style={[styles.deleteActionContent, { transform: [{ scale }] }]}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={COLORS.textOnPrimary}
            />
            <Text style={styles.deleteActionText}>Delete</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [handleDelete]
  );

  return (
    <ScaleDecorator>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        overshootRight={false}
        enabled={!isEditing}
      >
        <View style={[styles.habitItem, isActive && styles.habitItemActive]}>
          {/* Drag handle */}
          <TouchableOpacity
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              drag();
            }}
            delayLongPress={150}
            style={styles.dragHandle}
          >
            <Ionicons name="menu" size={24} color={COLORS.textTertiary} />
          </TouchableOpacity>

          {/* Habit name / edit input */}
          <View style={styles.habitContent}>
            {isEditing ? (
              <TextInput
                ref={inputRef}
                style={styles.editInput}
                value={editValue}
                onChangeText={onEditChange}
                onBlur={onEditSave}
                onSubmitEditing={onEditSave}
                returnKeyType="done"
                autoFocus
                selectTextOnFocus
              />
            ) : (
              <TouchableOpacity
                onPress={handleEditStart}
                style={styles.habitNameContainer}
                activeOpacity={0.7}
              >
                <Text style={styles.habitName}>{habit.name}</Text>
                <Ionicons
                  name="pencil-outline"
                  size={16}
                  color={COLORS.textTertiary}
                  style={styles.editIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Swipeable>
    </ScaleDecorator>
  );
}

export default function HabitsScreen() {
  const { data: habits = [], isLoading, isError, refetch } = useHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const reorderHabits = useReorderHabits();

  // Add habit state
  const [newHabitName, setNewHabitName] = useState("");
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const newHabitInputRef = useRef<TextInput>(null);

  // Edit habit state
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Sort habits by position
  const sortedHabits = [...habits].sort((a, b) => a.position - b.position);

  const handleEditStart = useCallback(
    (habit: Habit) => {
      setEditingHabitId(habit.id);
      setEditValue(habit.name);
    },
    [setEditingHabitId, setEditValue]
  );

  const handleEditSave = useCallback(() => {
    if (editingHabitId === null) return;

    const originalHabit = habits.find((h) => h.id === editingHabitId);
    const trimmedValue = editValue.trim();

    // Only update if the name changed and is not empty
    if (trimmedValue && originalHabit && trimmedValue !== originalHabit.name) {
      updateHabit.mutate({
        habitId: editingHabitId,
        updates: { name: trimmedValue },
      });
    }

    setEditingHabitId(null);
    setEditValue("");
  }, [
    editingHabitId,
    editValue,
    habits,
    updateHabit,
    setEditingHabitId,
    setEditValue,
  ]);

  const handleDelete = useCallback(
    (habit: Habit) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      deleteHabit.mutate(habit.id);
    },
    [deleteHabit]
  );

  const handleAddHabit = useCallback(() => {
    const trimmedName = newHabitName.trim();
    if (!trimmedName) return;

    if (habits.length >= MAX_HABITS) {
      Alert.alert(
        "Habit Limit Reached",
        `You can only have up to ${MAX_HABITS} habits. Please delete an existing habit before adding a new one.`
      );
      return;
    }

    createHabit.mutate(trimmedName, {
      onSuccess: () => {
        setNewHabitName("");
        setIsAddingHabit(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    });
  }, [
    newHabitName,
    habits.length,
    createHabit,
    setNewHabitName,
    setIsAddingHabit,
  ]);

  const handleDragEnd = useCallback(
    ({ data }: { data: Habit[] }) => {
      // Create position updates
      const positions = data.map((habit, index) => ({
        id: habit.id,
        position: index,
      }));

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      reorderHabits.mutate(positions);
    },
    [reorderHabits]
  );

  const handleStartAddingHabit = useCallback(() => {
    if (habits.length >= MAX_HABITS) {
      Alert.alert(
        "Habit Limit Reached",
        `You can only have up to ${MAX_HABITS} habits. Please delete an existing habit before adding a new one.`
      );
      return;
    }

    setIsAddingHabit(true);
    // Focus the input after state update
    setTimeout(() => {
      newHabitInputRef.current?.focus();
    }, 100);
  }, [habits.length, setIsAddingHabit]);

  const handleCancelAdd = useCallback(() => {
    setIsAddingHabit(false);
    setNewHabitName("");
  }, [setIsAddingHabit, setNewHabitName]);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Habit>) => (
      <HabitItem
        habit={item}
        isEditing={editingHabitId === item.id}
        editValue={editValue}
        onEditStart={handleEditStart}
        onEditChange={setEditValue}
        onEditSave={handleEditSave}
        onDelete={handleDelete}
        drag={drag}
        isActive={isActive}
      />
    ),
    [
      editingHabitId,
      editValue,
      handleEditStart,
      handleEditSave,
      handleDelete,
      setEditValue,
    ]
  );

  const keyExtractor = useCallback((item: Habit) => item.id.toString(), []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={COLORS.error}
          />
          <Text style={styles.errorText}>Failed to load habits</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {/* Header info */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Habits</Text>
          <Text style={styles.headerSubtitle}>
            Drag to reorder, tap to edit, swipe left to delete
          </Text>
          <Text style={styles.habitCount}>
            {habits.length} / {MAX_HABITS} habits
          </Text>
        </View>

        {/* Habits list */}
        {sortedHabits.length > 0 ? (
          <DraggableFlatList
            data={sortedHabits}
            onDragEnd={handleDragEnd}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            containerStyle={styles.listContainer}
            activationDistance={10}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="leaf-outline"
              size={64}
              color={COLORS.textTertiary}
            />
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySubtitle}>
              Add habits to track your daily non-negotiables
            </Text>
          </View>
        )}

        {/* Add habit section */}
        <View style={styles.addHabitSection}>
          {isAddingHabit ? (
            <View style={styles.addHabitInputContainer}>
              <TextInput
                ref={newHabitInputRef}
                style={styles.addHabitInput}
                value={newHabitName}
                onChangeText={setNewHabitName}
                placeholder="Enter habit name..."
                placeholderTextColor={COLORS.textTertiary}
                returnKeyType="done"
                onSubmitEditing={handleAddHabit}
                autoFocus
              />
              <View style={styles.addHabitActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelAdd}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    !newHabitName.trim() && styles.saveButtonDisabled,
                  ]}
                  onPress={handleAddHabit}
                  activeOpacity={0.7}
                  disabled={!newHabitName.trim() || createHabit.isPending}
                >
                  {createHabit.isPending ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.textOnPrimary}
                    />
                  ) : (
                    <Text style={styles.saveButtonText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.addHabitButton,
                habits.length >= MAX_HABITS && styles.addHabitButtonDisabled,
              ]}
              onPress={handleStartAddingHabit}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={
                  habits.length >= MAX_HABITS
                    ? COLORS.textTertiary
                    : COLORS.primary
                }
              />
              <Text
                style={[
                  styles.addHabitButtonText,
                  habits.length >= MAX_HABITS &&
                    styles.addHabitButtonTextDisabled,
                ]}
              >
                Add Habit
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  habitCount: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: "500",
  },
  listContainer: {
    flex: 1,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  habitItemActive: {
    backgroundColor: COLORS.backgroundSecondary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dragHandle: {
    padding: 8,
    marginRight: 8,
  },
  habitContent: {
    flex: 1,
  },
  habitNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  editIcon: {
    marginLeft: 8,
    opacity: 0.5,
  },
  editInput: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
  },
  deleteAction: {
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  deleteActionContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  deleteActionText: {
    color: COLORS.textOnPrimary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  addHabitSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  addHabitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: COLORS.primaryLight + "15",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
    borderStyle: "dashed",
  },
  addHabitButtonDisabled: {
    backgroundColor: COLORS.border + "30",
    borderColor: COLORS.border,
  },
  addHabitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 8,
  },
  addHabitButtonTextDisabled: {
    color: COLORS.textTertiary,
  },
  addHabitInputContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addHabitInput: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  addHabitActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    minWidth: 60,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },
});
