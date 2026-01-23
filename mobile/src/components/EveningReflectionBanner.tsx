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
  ScrollView,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/theme/colors";
import { useUpdateDailyPlan, DailyPlan } from "@/hooks/useDailyPlan";

// ============================================================================
// Types
// ============================================================================

/** Mood options for evening reflection */
type MoodOption = {
  id: string;
  emoji: string;
  label: string;
};

/** Props for the EveningReflectionBanner component */
interface EveningReflectionBannerProps {
  /** The current daily plan */
  dailyPlan: DailyPlan | null | undefined;
  /** Whether to show the banner (based on time and completion status) */
  visible: boolean;
  /** Callback when banner is dismissed for the session */
  onDismiss: () => void;
}

/** Props for the ReflectionModal component */
interface ReflectionModalProps {
  /** Whether the modal should be visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** The daily plan to update */
  dailyPlan: DailyPlan;
  /** Callback when reflection is successfully saved */
  onSaved?: () => void;
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if it's past 6 PM (18:00) local time.
 */
export function isEveningTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 18;
}

/**
 * Checks if the daily plan needs evening reflection.
 */
export function needsEveningReflection(
  dailyPlan: DailyPlan | null | undefined
): boolean {
  if (!dailyPlan) return false;
  // Show banner if shutdown_shipped is empty/null
  return !dailyPlan.shutdown_shipped || dailyPlan.shutdown_shipped.trim() === "";
}

// ============================================================================
// Mood Selector Component
// ============================================================================

interface MoodSelectorProps {
  selectedMood: string | null;
  onSelect: (moodId: string) => void;
}

function MoodSelector({ selectedMood, onSelect }: MoodSelectorProps) {
  const handleSelect = async (moodId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(moodId);
  };

  return (
    <View style={styles.moodContainer}>
      <Text style={styles.moodLabel}>How was your day?</Text>
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
                styles.moodText,
                selectedMood === mood.id && styles.moodTextSelected,
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
// Reflection Modal Component
// ============================================================================

function ReflectionModal({
  visible,
  onClose,
  dailyPlan,
  onSaved,
}: ReflectionModalProps) {
  // Refs
  const bottomSheetRef = useRef<BottomSheet>(null);
  const shippedInputRef = useRef<TextInput>(null);

  // State
  const [shutdownShipped, setShutdownShipped] = useState(
    dailyPlan?.shutdown_shipped ?? ""
  );
  const [shutdownBlocked, setShutdownBlocked] = useState(
    dailyPlan?.shutdown_blocked ?? ""
  );
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const updateDailyPlan = useUpdateDailyPlan();

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ["75%", "90%"], []);

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        // Reset error when closed
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

  // Handle save reflection
  const handleSave = async () => {
    const trimmedShipped = shutdownShipped.trim();

    if (!trimmedShipped) {
      setError("Please share what you shipped today");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Build the payload - include mood in shutdown_shipped if selected
      let shippedContent = trimmedShipped;
      if (selectedMood) {
        const moodOption = MOOD_OPTIONS.find((m) => m.id === selectedMood);
        if (moodOption) {
          shippedContent = `${moodOption.emoji} ${trimmedShipped}`;
        }
      }

      await updateDailyPlan.mutateAsync({
        planId: dailyPlan.id,
        payload: {
          daily_plan: {
            shutdown_shipped: shippedContent,
            shutdown_blocked: shutdownBlocked.trim() || null,
          },
        },
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (onSaved) {
        onSaved();
      }

      // Close the modal
      bottomSheetRef.current?.close();
    } catch (err) {
      console.error("Failed to save reflection:", err);
      setError("Failed to save reflection. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Close modal programmatically
  const handleClose = () => {
    bottomSheetRef.current?.close();
  };

  // Effect to open/close sheet based on visible prop
  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
      // Reset form with current values
      setShutdownShipped(dailyPlan?.shutdown_shipped ?? "");
      setShutdownBlocked(dailyPlan?.shutdown_blocked ?? "");
      setSelectedMood(null);
      setError(null);
      // Focus shipped input after sheet opens
      setTimeout(() => {
        shippedInputRef.current?.focus();
      }, 300);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, dailyPlan]);

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
        <BottomSheetScrollView
          contentContainerStyle={styles.modalContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Evening Reflection</Text>
              <Text style={styles.modalSubtitle}>
                Take a moment to reflect on your day
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Mood selector */}
          <MoodSelector selectedMood={selectedMood} onSelect={setSelectedMood} />

          {/* What shipped? */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>What shipped today? *</Text>
            <Text style={styles.inputHelper}>
              What did you accomplish or make progress on?
            </Text>
            <TextInput
              ref={shippedInputRef}
              style={styles.textArea}
              value={shutdownShipped}
              onChangeText={(text) => {
                setShutdownShipped(text);
                if (error) setError(null);
              }}
              placeholder="I completed..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* What blocked you? */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>What blocked you?</Text>
            <Text style={styles.inputHelper}>
              Any challenges or obstacles you encountered
            </Text>
            <TextInput
              style={styles.textArea}
              value={shutdownBlocked}
              onChangeText={setShutdownBlocked}
              placeholder="I got stuck on..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!shutdownShipped.trim() || isSaving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!shutdownShipped.trim() || isSaving}
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
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

// ============================================================================
// Main Banner Component
// ============================================================================

export function EveningReflectionBanner({
  dailyPlan,
  visible,
  onDismiss,
}: EveningReflectionBannerProps) {
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleDismiss = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  const handleSaved = () => {
    setShowModal(false);
    onDismiss(); // Hide banner after successful save
  };

  // Don't render if not visible or no daily plan
  if (!visible || !dailyPlan) {
    return null;
  }

  return (
    <>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerIcon}>
            <Ionicons name="moon" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Time to reflect on your day</Text>
            <Text style={styles.bannerSubtitle}>
              Take a moment to capture what you shipped
            </Text>
          </View>
        </View>
        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={styles.bannerDismissButton}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.bannerDismissText}>Later</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bannerReflectButton}
            onPress={handleOpenModal}
            activeOpacity={0.8}
          >
            <Text style={styles.bannerReflectText}>Reflect</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reflection Modal */}
      <ReflectionModal
        visible={showModal}
        onClose={handleCloseModal}
        dailyPlan={dailyPlan}
        onSaved={handleSaved}
      />
    </>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Banner styles
  banner: {
    backgroundColor: COLORS.primary + "10",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  bannerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
  },
  bannerDismissButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bannerDismissText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  bannerReflectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  bannerReflectText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },

  // Modal styles
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
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

  // Mood selector
  moodContainer: {
    marginBottom: 24,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 12,
  },
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
  },
  moodOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  moodTextSelected: {
    color: COLORS.primary,
  },

  // Input fields
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  inputHelper: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 100,
  },

  // Save button
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
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
