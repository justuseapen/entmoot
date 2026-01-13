import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { RootStackScreenProps } from "../../navigation/types";
import type {
  TimeScale,
  GoalStatus,
  GoalVisibility,
  UpdateGoalData,
  FamilyMember,
  Goal,
} from "@shared/types";
import { getFamilies } from "../../lib/families";
import {
  getGoal,
  updateGoal,
  getFamilyMembers,
  getLinkableGoals,
  formatTimeScale,
  formatStatus,
  formatVisibility,
} from "../../lib/goals";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  creamWhite: "#FFF8E7",
  earthBrown: "#795548",
  darkForest: "#1B3A1A",
  warmGold: "#FFD54F",
  sunsetOrange: "#FF7043",
};

type Props = RootStackScreenProps<"EditGoal">;

const TIME_SCALES: TimeScale[] = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
];
const STATUSES: GoalStatus[] = [
  "not_started",
  "in_progress",
  "at_risk",
  "completed",
  "abandoned",
];
const VISIBILITIES: GoalVisibility[] = ["personal", "shared", "family"];

// Picker component for selecting from options
function OptionPicker<T extends string>({
  label,
  value,
  options,
  formatOption,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  formatOption: (v: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.optionsRow}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.optionChip,
                value === opt && styles.optionChipSelected,
              ]}
              onPress={() => onChange(opt)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  value === opt && styles.optionChipTextSelected,
                ]}
              >
                {formatOption(opt)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function EditGoalScreen({ route, navigation }: Props) {
  const { goalId } = route.params;
  const [familyId, setFamilyId] = useState<number | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [parentGoals, setParentGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeScale, setTimeScale] = useState<TimeScale>("weekly");
  const [status, setStatus] = useState<GoalStatus>("not_started");
  const [visibility, setVisibility] = useState<GoalVisibility>("family");
  const [progress, setProgress] = useState(0);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const [parentId, setParentId] = useState<number | null>(null);

  // SMART fields
  const [specific, setSpecific] = useState("");
  const [measurable, setMeasurable] = useState("");
  const [achievable, setAchievable] = useState("");
  const [relevant, setRelevant] = useState("");
  const [timeBound, setTimeBound] = useState("");

  // Modal visibility
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        const familiesRes = await getFamilies();
        const fId = familiesRes.families[0]?.id;
        if (!fId) {
          Alert.alert("Error", "No family found");
          navigation.goBack();
          return;
        }
        setFamilyId(fId);

        const [goal, membersRes, goalsRes] = await Promise.all([
          getGoal(fId, parseInt(goalId, 10)),
          getFamilyMembers(fId),
          getLinkableGoals(fId),
        ]);

        // Filter out the current goal from parent options
        setParentGoals(goalsRes.filter((g) => g.id !== goal.id));
        setMembers(membersRes.members);

        // Populate form with goal data
        setTitle(goal.title);
        setDescription(goal.description || "");
        setTimeScale(goal.time_scale);
        setStatus(goal.status);
        setVisibility(goal.visibility);
        setProgress(goal.progress);
        setDueDate(goal.due_date ? new Date(goal.due_date) : null);
        setSelectedAssignees(goal.assignees.map((a) => a.id));
        setParentId(goal.parent_id);
        setSpecific(goal.specific || "");
        setMeasurable(goal.measurable || "");
        setAchievable(goal.achievable || "");
        setRelevant(goal.relevant || "");
        setTimeBound(goal.time_bound || "");
      } catch (error) {
        console.error("Failed to load goal:", error);
        Alert.alert("Error", "Failed to load goal");
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [goalId, navigation]);

  const handleSave = async () => {
    if (!familyId) return;

    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for your goal");
      return;
    }

    setIsSaving(true);
    try {
      const data: UpdateGoalData = {
        title: title.trim(),
        description: description.trim() || undefined,
        time_scale: timeScale,
        status,
        visibility,
        progress,
        due_date: dueDate ? dueDate.toISOString().split("T")[0] : undefined,
        assignee_ids:
          selectedAssignees.length > 0 ? selectedAssignees : undefined,
        parent_id: parentId,
        specific: specific.trim() || undefined,
        measurable: measurable.trim() || undefined,
        achievable: achievable.trim() || undefined,
        relevant: relevant.trim() || undefined,
        time_bound: timeBound.trim() || undefined,
      };

      await updateGoal(familyId, parseInt(goalId, 10), data);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to update goal:", error);
      Alert.alert("Error", "Failed to update goal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAssignee = (memberId: number) => {
    setSelectedAssignees((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const selectedParentGoal = parentGoals.find((g) => g.id === parentId);
  const selectedMemberNames = members
    .filter((m) => selectedAssignees.includes(m.user_id))
    .map((m) => m.name);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.forestGreen} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Title *</Text>
        <TextInput
          style={styles.textInput}
          value={title}
          onChangeText={setTitle}
          placeholder="What do you want to achieve?"
          placeholderTextColor={`${COLORS.earthBrown}60`}
        />
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add more details about this goal..."
          placeholderTextColor={`${COLORS.earthBrown}60`}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Progress Slider */}
      <View style={styles.field}>
        <View style={styles.progressHeader}>
          <Text style={styles.fieldLabel}>Progress</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={progress}
          onValueChange={setProgress}
          minimumTrackTintColor={COLORS.forestGreen}
          maximumTrackTintColor={`${COLORS.earthBrown}30`}
          thumbTintColor={COLORS.forestGreen}
        />
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>0%</Text>
          <Text style={styles.progressLabel}>100%</Text>
        </View>
      </View>

      {/* Status */}
      <OptionPicker
        label="Status"
        value={status}
        options={STATUSES}
        formatOption={formatStatus}
        onChange={setStatus}
      />

      {/* Time Scale */}
      <OptionPicker
        label="Time Scale"
        value={timeScale}
        options={TIME_SCALES}
        formatOption={formatTimeScale}
        onChange={setTimeScale}
      />

      {/* Visibility */}
      <OptionPicker
        label="Visibility"
        value={visibility}
        options={VISIBILITIES}
        formatOption={formatVisibility}
        onChange={setVisibility}
      />

      {/* Due Date */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Due Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text
            style={
              dueDate ? styles.dateButtonText : styles.dateButtonPlaceholder
            }
          >
            {dueDate
              ? dueDate.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Select a due date"}
          </Text>
          {dueDate && (
            <TouchableOpacity onPress={() => setDueDate(null)}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
          />
        )}
        {Platform.OS === "ios" && showDatePicker && (
          <TouchableOpacity
            style={styles.closeDatePicker}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.closeDatePickerText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Assignees */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Assign to</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setShowAssigneeModal(true)}
        >
          <Text
            style={
              selectedMemberNames.length > 0
                ? styles.selectorButtonText
                : styles.selectorButtonPlaceholder
            }
          >
            {selectedMemberNames.length > 0
              ? selectedMemberNames.join(", ")
              : "Select family members"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Parent Goal */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Link to Parent Goal</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setShowParentModal(true)}
        >
          <Text
            style={
              selectedParentGoal
                ? styles.selectorButtonText
                : styles.selectorButtonPlaceholder
            }
          >
            {selectedParentGoal
              ? selectedParentGoal.title
              : "Optional: link to a larger goal"}
          </Text>
          {parentId && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setParentId(null);
              }}
            >
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* SMART Criteria Section */}
      <View style={styles.smartSection}>
        <Text style={styles.sectionTitle}>SMART Criteria</Text>

        <View style={styles.field}>
          <Text style={styles.smartLabel}>Specific</Text>
          <TextInput
            style={[styles.textInput, styles.smartInput]}
            value={specific}
            onChangeText={setSpecific}
            placeholder="What exactly will you accomplish?"
            placeholderTextColor={`${COLORS.earthBrown}60`}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.smartLabel}>Measurable</Text>
          <TextInput
            style={[styles.textInput, styles.smartInput]}
            value={measurable}
            onChangeText={setMeasurable}
            placeholder="How will you track progress?"
            placeholderTextColor={`${COLORS.earthBrown}60`}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.smartLabel}>Achievable</Text>
          <TextInput
            style={[styles.textInput, styles.smartInput]}
            value={achievable}
            onChangeText={setAchievable}
            placeholder="Is this realistic?"
            placeholderTextColor={`${COLORS.earthBrown}60`}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.smartLabel}>Relevant</Text>
          <TextInput
            style={[styles.textInput, styles.smartInput]}
            value={relevant}
            onChangeText={setRelevant}
            placeholder="Why does this matter?"
            placeholderTextColor={`${COLORS.earthBrown}60`}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.smartLabel}>Time-Bound</Text>
          <TextInput
            style={[styles.textInput, styles.smartInput]}
            value={timeBound}
            onChangeText={setTimeBound}
            placeholder="When will you complete this?"
            placeholderTextColor={`${COLORS.earthBrown}60`}
            multiline
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving || !title.trim()}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      {/* Assignee Modal */}
      <Modal
        visible={showAssigneeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAssigneeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Assignees</Text>
            <FlatList
              data={members}
              keyExtractor={(item) => item.user_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.memberItem,
                    selectedAssignees.includes(item.user_id) &&
                      styles.memberItemSelected,
                  ]}
                  onPress={() => toggleAssignee(item.user_id)}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitial}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.memberName}>{item.name}</Text>
                  {selectedAssignees.includes(item.user_id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAssigneeModal(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Parent Goal Modal */}
      <Modal
        visible={showParentModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowParentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link to Parent Goal</Text>
            <FlatList
              data={parentGoals}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.goalItem,
                    parentId === item.id && styles.goalItemSelected,
                  ]}
                  onPress={() => {
                    setParentId(item.id);
                    setShowParentModal(false);
                  }}
                >
                  <Text style={styles.goalItemTitle}>{item.title}</Text>
                  <Text style={styles.goalItemMeta}>
                    {formatTimeScale(item.time_scale)} •{" "}
                    {formatStatus(item.status)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No goals available to link</Text>
              }
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowParentModal(false)}
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
    paddingBottom: 40,
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
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkForest,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.darkForest,
    borderWidth: 1,
    borderColor: `${COLORS.earthBrown}20`,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
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
  optionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: `${COLORS.earthBrown}30`,
  },
  optionChipSelected: {
    backgroundColor: COLORS.forestGreen,
    borderColor: COLORS.forestGreen,
  },
  optionChipText: {
    fontSize: 14,
    color: COLORS.earthBrown,
  },
  optionChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dateButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${COLORS.earthBrown}20`,
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.darkForest,
  },
  dateButtonPlaceholder: {
    fontSize: 16,
    color: `${COLORS.earthBrown}60`,
  },
  clearButton: {
    fontSize: 16,
    color: COLORS.earthBrown,
    padding: 4,
  },
  closeDatePicker: {
    alignItems: "center",
    paddingVertical: 12,
  },
  closeDatePickerText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.forestGreen,
  },
  selectorButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${COLORS.earthBrown}20`,
  },
  selectorButtonText: {
    fontSize: 16,
    color: COLORS.darkForest,
    flex: 1,
  },
  selectorButtonPlaceholder: {
    fontSize: 16,
    color: `${COLORS.earthBrown}60`,
    flex: 1,
  },
  smartSection: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: `${COLORS.forestGreen}08`,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.darkForest,
    marginBottom: 16,
  },
  smartLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.forestGreen,
    marginBottom: 8,
  },
  smartInput: {
    minHeight: 60,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: COLORS.forestGreen,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.earthBrown,
  },
  cancelButtonText: {
    color: COLORS.earthBrown,
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
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.darkForest,
    marginBottom: 16,
    textAlign: "center",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  memberItemSelected: {
    backgroundColor: `${COLORS.forestGreen}15`,
    borderWidth: 1,
    borderColor: COLORS.forestGreen,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.forestGreen,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInitial: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkForest,
  },
  checkmark: {
    fontSize: 18,
    color: COLORS.forestGreen,
    fontWeight: "bold",
  },
  goalItem: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  goalItemSelected: {
    backgroundColor: `${COLORS.forestGreen}15`,
    borderWidth: 1,
    borderColor: COLORS.forestGreen,
  },
  goalItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkForest,
    marginBottom: 4,
  },
  goalItemMeta: {
    fontSize: 13,
    color: COLORS.earthBrown,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.earthBrown,
    textAlign: "center",
    padding: 24,
  },
  modalCloseButton: {
    marginTop: 12,
    padding: 16,
    alignItems: "center",
    backgroundColor: COLORS.forestGreen,
    borderRadius: 12,
  },
  modalCloseText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
