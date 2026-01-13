import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import type { MainTabScreenProps } from "../../navigation/types";
import type { Goal, GoalStatus, TimeScale, Family } from "@shared/types";
import { getFamilies } from "../../lib/families";
import {
  getGoals,
  formatTimeScale,
  formatStatus,
  getStatusColor,
  formatDueDate,
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

type Props = MainTabScreenProps<"Goals">;

// Filter options
const TIME_SCALES: (TimeScale | "all")[] = [
  "all",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
];

const STATUSES: (GoalStatus | "all")[] = [
  "all",
  "not_started",
  "in_progress",
  "at_risk",
  "completed",
  "abandoned",
];

// Goal Card Component
function GoalCard({
  goal,
  onPress,
}: {
  goal: Goal;
  onPress: (goal: Goal) => void;
}) {
  const statusColor = getStatusColor(goal.status);
  const isOverdue =
    goal.due_date &&
    new Date(goal.due_date) < new Date() &&
    goal.status !== "completed";

  return (
    <TouchableOpacity
      style={styles.goalCard}
      onPress={() => onPress(goal)}
      activeOpacity={0.7}
    >
      <View style={styles.goalCardHeader}>
        <View style={styles.goalTitleRow}>
          <Text style={styles.timeScaleEmoji}>
            {getTimeScaleEmoji(goal.time_scale)}
          </Text>
          <Text style={styles.goalTitle} numberOfLines={2}>
            {goal.title}
          </Text>
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

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${goal.progress}%`,
                backgroundColor:
                  goal.progress === 100 ? COLORS.leafGreen : COLORS.forestGreen,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{goal.progress}%</Text>
      </View>

      {/* Meta Info */}
      <View style={styles.goalMeta}>
        <Text style={[styles.dueDate, isOverdue && styles.dueDateOverdue]}>
          {formatDueDate(goal.due_date)}
        </Text>
        <Text style={styles.timeScale}>{formatTimeScale(goal.time_scale)}</Text>
      </View>

      {/* Assignees */}
      {goal.assignees && goal.assignees.length > 0 && (
        <View style={styles.assigneesRow}>
          {goal.assignees.slice(0, 3).map((assignee, index) => (
            <View
              key={assignee.id}
              style={[styles.avatarCircle, { marginLeft: index > 0 ? -8 : 0 }]}
            >
              <Text style={styles.avatarInitial}>
                {assignee.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
          {goal.assignees.length > 3 && (
            <Text style={styles.moreAssignees}>
              +{goal.assignees.length - 3}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// Filter Chip Component
function FilterChip({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, isSelected && styles.filterChipSelected]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterChipText,
          isSelected && styles.filterChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function GoalsScreen({ navigation }: Props) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamilyId, setCurrentFamilyId] = useState<number | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showFamilySwitcher, setShowFamilySwitcher] = useState(false);

  // Filters
  const [selectedTimeScale, setSelectedTimeScale] = useState<TimeScale | "all">(
    "all"
  );
  const [selectedStatus, setSelectedStatus] = useState<GoalStatus | "all">(
    "all"
  );

  const loadData = useCallback(async () => {
    try {
      // Load families first
      const familiesRes = await getFamilies();
      setFamilies(familiesRes.families);

      const familyId = currentFamilyId || familiesRes.families[0]?.id;
      if (familyId && !currentFamilyId) {
        setCurrentFamilyId(familyId);
      }

      if (familyId) {
        const filters: { time_scale?: TimeScale; status?: GoalStatus } = {};
        if (selectedTimeScale !== "all") filters.time_scale = selectedTimeScale;
        if (selectedStatus !== "all") filters.status = selectedStatus;

        const goalsRes = await getGoals(familyId, filters);
        setGoals(goalsRes.goals);
      }
    } catch (error) {
      console.error("Failed to load goals:", error);
    }
  }, [currentFamilyId, selectedTimeScale, selectedStatus]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    load();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleGoalPress = (goal: Goal) => {
    navigation.navigate("GoalDetail", { goalId: goal.id.toString() });
  };

  const handleCreateGoal = () => {
    navigation.navigate("CreateGoal");
  };

  const handleFamilySelect = (familyId: number) => {
    setCurrentFamilyId(familyId);
    setShowFamilySwitcher(false);
  };

  const clearFilters = () => {
    setSelectedTimeScale("all");
    setSelectedStatus("all");
  };

  const hasActiveFilters =
    selectedTimeScale !== "all" || selectedStatus !== "all";
  const currentFamily = families.find((f) => f.id === currentFamilyId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.forestGreen} />
        <Text style={styles.loadingText}>Loading your quests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Family Switcher and Create Button */}
      <View style={styles.header}>
        {families.length > 1 ? (
          <TouchableOpacity
            style={styles.familySwitcherButton}
            onPress={() => setShowFamilySwitcher(true)}
          >
            <Text style={styles.familySwitcherText}>
              {currentFamily?.name || "Select Family"}
            </Text>
            <Text style={styles.familySwitcherIcon}>▼</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.familyBadge}>
            <Text style={styles.familyBadgeText}>
              {currentFamily?.name || "Family"}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateGoal}
        >
          <Text style={styles.createButtonText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Controls */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[
            styles.filterToggle,
            showFilters && styles.filterToggleActive,
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterToggleText}>
            Filters {hasActiveFilters ? "●" : ""}
          </Text>
        </TouchableOpacity>
        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Time Scale</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
          >
            {TIME_SCALES.map((ts) => (
              <FilterChip
                key={ts}
                label={ts === "all" ? "All" : formatTimeScale(ts)}
                isSelected={selectedTimeScale === ts}
                onPress={() => setSelectedTimeScale(ts)}
              />
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Status</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
          >
            {STATUSES.map((s) => (
              <FilterChip
                key={s}
                label={s === "all" ? "All" : formatStatus(s)}
                isSelected={selectedStatus === s}
                onPress={() => setSelectedStatus(s)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Goals List */}
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <GoalCard goal={item} onPress={handleGoalPress} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.forestGreen}
            colors={[COLORS.forestGreen]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyText}>
              Start your adventure by creating your first goal!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleCreateGoal}
            >
              <Text style={styles.emptyButtonText}>Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        }
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.creamWhite,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
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
  createButton: {
    backgroundColor: COLORS.forestGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: `${COLORS.earthBrown}30`,
  },
  filterToggleActive: {
    backgroundColor: `${COLORS.forestGreen}10`,
    borderColor: COLORS.forestGreen,
  },
  filterToggleText: {
    fontSize: 14,
    color: COLORS.earthBrown,
  },
  clearFiltersText: {
    fontSize: 14,
    color: COLORS.forestGreen,
    fontWeight: "500",
  },
  filterPanel: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.darkForest,
    marginBottom: 8,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: `${COLORS.earthBrown}10`,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: COLORS.forestGreen,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.earthBrown,
  },
  filterChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  goalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  goalTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    marginRight: 8,
  },
  timeScaleEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  goalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkForest,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: `${COLORS.earthBrown}15`,
    borderRadius: 4,
    marginRight: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.darkForest,
    width: 40,
    textAlign: "right",
  },
  goalMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dueDate: {
    fontSize: 13,
    color: COLORS.earthBrown,
  },
  dueDateOverdue: {
    color: COLORS.sunsetOrange,
    fontWeight: "500",
  },
  timeScale: {
    fontSize: 12,
    color: `${COLORS.earthBrown}80`,
  },
  assigneesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.earthBrown}10`,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.forestGreen,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  moreAssignees: {
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.earthBrown,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.darkForest,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.earthBrown,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.forestGreen,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
    maxHeight: "50%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.darkForest,
    marginBottom: 16,
    textAlign: "center",
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
