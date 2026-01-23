import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/theme/colors";
import { useCreateReflection, ReflectionMood } from "@/hooks/useReflections";

// ============================================================================
// Types
// ============================================================================

/** Mood option for selector */
interface MoodOption {
  id: ReflectionMood;
  emoji: string;
  label: string;
}

// ============================================================================
// Constants
// ============================================================================

const MOOD_OPTIONS: MoodOption[] = [
  { id: "great", emoji: "😄", label: "Great" },
  { id: "good", emoji: "🙂", label: "Good" },
  { id: "okay", emoji: "😐", label: "Okay" },
  { id: "difficult", emoji: "😔", label: "Difficult" },
  { id: "rough", emoji: "😫", label: "Rough" },
];

const ENERGY_LABELS = ["Low", "Below Avg", "Average", "Above Avg", "High"];

// ============================================================================
// Mood Selector Component
// ============================================================================

interface MoodSelectorProps {
  selectedMood: ReflectionMood | null;
  onSelect: (mood: ReflectionMood) => void;
}

function MoodSelector({ selectedMood, onSelect }: MoodSelectorProps) {
  const handleSelect = async (mood: ReflectionMood) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(mood);
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>How are you feeling?</Text>
      <View style={styles.moodOptions}>
        {MOOD_OPTIONS.map((mood) => (
          <TouchableOpacity
            key={mood.id}
            style={[
              styles.moodOption,
              selectedMood === mood.id && styles.moodOptionSelected,
            ]}
            onPress={() => handleSelect(mood.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text
              style={[
                styles.moodLabel,
                selectedMood === mood.id && styles.moodLabelSelected,
              ]}
            >
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// Energy Level Slider Component
// ============================================================================

interface EnergySliderProps {
  value: number;
  onChange: (value: number) => void;
}

function EnergySlider({ value, onChange }: EnergySliderProps) {
  const handleValueChange = async (newValue: number) => {
    const roundedValue = Math.round(newValue);
    if (roundedValue !== value) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(roundedValue);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Energy Level</Text>
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={value}
          onValueChange={handleValueChange}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor={COLORS.border}
          thumbTintColor={COLORS.primary}
        />
        <View style={styles.sliderLabels}>
          {ENERGY_LABELS.map((label, index) => (
            <Text
              key={index}
              style={[
                styles.sliderLabel,
                value === index + 1 && styles.sliderLabelActive,
              ]}
            >
              {label}
            </Text>
          ))}
        </View>
        <View style={styles.energyValueContainer}>
          <Text style={styles.energyValue}>{value}</Text>
          <Text style={styles.energyValueLabel}>
            {ENERGY_LABELS[value - 1]}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Gratitude Items Component
// ============================================================================

interface GratitudeItemsProps {
  items: string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}

function GratitudeItems({
  items,
  onAdd,
  onUpdate,
  onRemove,
}: GratitudeItemsProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleAdd = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd();
    // Focus the new input after state update
    setTimeout(() => {
      const lastIndex = items.length;
      inputRefs.current[lastIndex]?.focus();
    }, 100);
  };

  const handleRemove = async (index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove(index);
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>What are you grateful for?</Text>
      <Text style={styles.sectionSubtitle}>
        List things that brought you joy today
      </Text>

      {items.map((item, index) => (
        <View key={index} style={styles.gratitudeItemContainer}>
          <View style={styles.gratitudeNumberContainer}>
            <Text style={styles.gratitudeNumber}>{index + 1}</Text>
          </View>
          <TextInput
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={styles.gratitudeInput}
            value={item}
            onChangeText={(text) => onUpdate(index, text)}
            placeholder="I'm grateful for..."
            placeholderTextColor={COLORS.textSecondary}
            returnKeyType="done"
          />
          {items.length > 1 && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemove(index)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {items.length < 5 && (
        <TouchableOpacity
          style={styles.addGratitudeButton}
          onPress={handleAdd}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={20} color={COLORS.primary} />
          <Text style={styles.addGratitudeText}>Add another</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function QuickReflectionScreen() {
  const router = useRouter();
  const createReflection = useCreateReflection();

  // Form state
  const [selectedMood, setSelectedMood] = useState<ReflectionMood | null>(null);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [thoughts, setThoughts] = useState("");
  const [gratitudeItems, setGratitudeItems] = useState<string[]>([""]);
  const [isSaving, setIsSaving] = useState(false);

  // Gratitude handlers
  const handleAddGratitude = useCallback(() => {
    setGratitudeItems((prev) => [...prev, ""]);
  }, []);

  const handleUpdateGratitude = useCallback((index: number, value: string) => {
    setGratitudeItems((prev) => {
      const newItems = [...prev];
      newItems[index] = value;
      return newItems;
    });
  }, []);

  const handleRemoveGratitude = useCallback((index: number) => {
    setGratitudeItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Save handler
  const handleSave = async () => {
    // At least mood should be selected for a quick reflection
    if (!selectedMood) {
      Alert.alert("Missing Mood", "Please select how you're feeling today.");
      return;
    }

    setIsSaving(true);

    try {
      // Filter out empty gratitude items
      const filteredGratitude = gratitudeItems
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      // Build reflection responses for the "thoughts" if provided
      const reflectionResponses = thoughts.trim()
        ? [{ prompt: "What's on your mind?", response: thoughts.trim() }]
        : [];

      await createReflection.mutateAsync({
        reflection_type: "quick",
        mood: selectedMood,
        energy_level: energyLevel,
        gratitude_items:
          filteredGratitude.length > 0 ? filteredGratitude : undefined,
        reflection_responses_attributes:
          reflectionResponses.length > 0 ? reflectionResponses : undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert("Reflection Saved", "Your quick reflection has been saved.", [
        {
          text: "Done",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Failed to save reflection:", error);
      Alert.alert("Error", "Failed to save your reflection. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.headerTitle}>Quick Reflection</Text>
            <Text style={styles.headerSubtitle}>
              Take a moment to check in with yourself
            </Text>
          </View>

          {/* Mood Selector */}
          <MoodSelector
            selectedMood={selectedMood}
            onSelect={setSelectedMood}
          />

          {/* Energy Level Slider */}
          <EnergySlider value={energyLevel} onChange={setEnergyLevel} />

          {/* What's on your mind */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{"What's on your mind?"}</Text>
            <TextInput
              style={styles.thoughtsInput}
              value={thoughts}
              onChangeText={setThoughts}
              placeholder="Share your thoughts, feelings, or observations..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Gratitude Items */}
          <GratitudeItems
            items={gratitudeItems}
            onAdd={handleAddGratitude}
            onUpdate={handleUpdateGratitude}
            onRemove={handleRemoveGratitude}
          />

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!selectedMood || isSaving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!selectedMood || isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color={COLORS.textOnPrimary} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.textOnPrimary}
                  />
                  <Text style={styles.saveButtonText}>Save Reflection</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // Header
  header: {
    alignItems: "center",
    paddingVertical: 24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Section
  sectionContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    marginTop: -8,
  },

  // Mood selector
  moodOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  moodOption: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: COLORS.surface,
  },
  moodOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  moodLabelSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  // Energy slider
  sliderContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textAlign: "center",
    flex: 1,
  },
  sliderLabelActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  energyValueContainer: {
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  energyValue: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.primary,
  },
  energyValueLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Thoughts input
  thoughtsInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 120,
  },

  // Gratitude items
  gratitudeItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  gratitudeNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  gratitudeNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  gratitudeInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  addGratitudeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    marginTop: 4,
  },
  addGratitudeText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.primary,
    marginLeft: 8,
  },

  // Footer
  footer: {
    marginTop: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },
});
