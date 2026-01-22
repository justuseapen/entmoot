import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";

import { COLORS } from "@/theme/colors";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  parseTimeString,
  formatTimeToString,
  DAY_LABELS,
} from "@/hooks";

// Section Component
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

// Toggle Row Component
interface ToggleRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({
  icon,
  label,
  sublabel,
  value,
  onValueChange,
  disabled = false,
}: ToggleRowProps) {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={20} color={COLORS.primary} />
        </View>
        <View style={styles.rowLabels}>
          <Text style={styles.rowLabel}>{label}</Text>
          {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: COLORS.border, true: COLORS.primary + "80" }}
        thumbColor={value ? COLORS.primary : COLORS.surface}
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );
}

// Time Picker Row Component
interface TimePickerRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onTimeChange: (time: string) => void;
  disabled?: boolean;
}

function TimePickerRow({
  icon,
  label,
  value,
  onTimeChange,
  disabled = false,
}: TimePickerRowProps) {
  const [showPicker, setShowPicker] = useState(false);
  const timeDate = parseTimeString(value);

  const handleChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowPicker(false);
      }
      if (selectedDate) {
        const formattedTime = formatTimeToString(selectedDate);
        if (formattedTime !== value) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTimeChange(formattedTime);
        }
      }
    },
    [value, onTimeChange]
  );

  const formatDisplayTime = (timeString: string): string => {
    const date = parseTimeString(timeString);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.row, disabled && styles.rowDisabled]}
        onPress={() => !disabled && setShowPicker(true)}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
      >
        <View style={styles.rowLeft}>
          <View style={styles.rowIcon}>
            <Ionicons name={icon} size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.timeValue}>{formatDisplayTime(value)}</Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textTertiary}
          />
        </View>
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={timeDate}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleChange}
            textColor={COLORS.text}
          />
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.pickerDoneButton}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}

// Day Picker Row Component
interface DayPickerRowProps {
  value: number;
  onDayChange: (day: number) => void;
  disabled?: boolean;
}

function DayPickerRow({ value, onDayChange, disabled = false }: DayPickerRowProps) {
  const [expanded, setExpanded] = useState(false);

  const handleDaySelect = useCallback(
    (day: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDayChange(day);
      setExpanded(false);
    },
    [onDayChange]
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.row, disabled && styles.rowDisabled]}
        onPress={() => !disabled && setExpanded(!expanded)}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
      >
        <View style={styles.rowLeft}>
          <View style={styles.rowIcon}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.rowLabel}>Review Day</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.timeValue}>{DAY_LABELS[value]}</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={COLORS.textTertiary}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.dayPickerContainer}>
          {DAY_LABELS.map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayOption,
                index === value && styles.dayOptionSelected,
              ]}
              onPress={() => handleDaySelect(index)}
            >
              <Text
                style={[
                  styles.dayOptionText,
                  index === value && styles.dayOptionTextSelected,
                ]}
              >
                {day}
              </Text>
              {index === value && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { data: preferences, isLoading, error } = useNotificationPreferences();
  const { mutate: updatePreferences, isPending: isSaving } =
    useUpdateNotificationPreferences();

  // Handle toggle changes
  const handleToggle = useCallback(
    (field: string, value: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updatePreferences({ [field]: value });
    },
    [updatePreferences]
  );

  // Handle time changes
  const handleTimeChange = useCallback(
    (field: string, value: string) => {
      updatePreferences({ [field]: value });
    },
    [updatePreferences]
  );

  // Handle day change
  const handleDayChange = useCallback(
    (day: number) => {
      updatePreferences({ weekly_review_day: day });
    },
    [updatePreferences]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !preferences) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Failed to load preferences</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight}>
          {isSaving && (
            <ActivityIndicator size="small" color={COLORS.primary} />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Reminders Section */}
        <Section title="Reminders">
          {/* Morning Planning */}
          <ToggleRow
            icon="sunny-outline"
            label="Morning Planning"
            sublabel="Get reminded to plan your day"
            value={preferences.reminders.morning_planning.enabled}
            onValueChange={(value) => handleToggle("morning_planning", value)}
          />
          {preferences.reminders.morning_planning.enabled && (
            <TimePickerRow
              icon="time-outline"
              label="Planning Time"
              value={preferences.reminders.morning_planning.time}
              onTimeChange={(time) =>
                handleTimeChange("morning_planning_time", time)
              }
            />
          )}

          {/* Evening Reflection */}
          <ToggleRow
            icon="moon-outline"
            label="Evening Reflection"
            sublabel="Get reminded to reflect on your day"
            value={preferences.reminders.evening_reflection.enabled}
            onValueChange={(value) => handleToggle("evening_reflection", value)}
          />
          {preferences.reminders.evening_reflection.enabled && (
            <TimePickerRow
              icon="time-outline"
              label="Reflection Time"
              value={preferences.reminders.evening_reflection.time}
              onTimeChange={(time) =>
                handleTimeChange("evening_reflection_time", time)
              }
            />
          )}

          {/* Weekly Review */}
          <ToggleRow
            icon="calendar-outline"
            label="Weekly Review"
            sublabel="Get reminded for your weekly review"
            value={preferences.reminders.weekly_review.enabled}
            onValueChange={(value) => handleToggle("weekly_review", value)}
          />
          {preferences.reminders.weekly_review.enabled && (
            <>
              <DayPickerRow
                value={preferences.reminders.weekly_review.day}
                onDayChange={handleDayChange}
              />
              <TimePickerRow
                icon="time-outline"
                label="Review Time"
                value={preferences.reminders.weekly_review.time}
                onTimeChange={(time) =>
                  handleTimeChange("weekly_review_time", time)
                }
              />
            </>
          )}

          {/* Tips */}
          <ToggleRow
            icon="bulb-outline"
            label="Tips & Suggestions"
            sublabel="Receive helpful tips and guidance"
            value={preferences.tips.enabled}
            onValueChange={(value) => handleToggle("tips_enabled", value)}
          />
        </Section>

        {/* Quiet Hours Section */}
        <Section title="Quiet Hours">
          <Text style={styles.sectionDescription}>
            No notifications will be sent during quiet hours.
          </Text>
          <TimePickerRow
            icon="moon-outline"
            label="Start Time"
            value={preferences.quiet_hours.start}
            onTimeChange={(time) =>
              handleTimeChange("quiet_hours_start", time)
            }
          />
          <TimePickerRow
            icon="sunny-outline"
            label="End Time"
            value={preferences.quiet_hours.end}
            onTimeChange={(time) => handleTimeChange("quiet_hours_end", time)}
          />
        </Section>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  headerSpacer: {
    width: 32,
  },
  headerRight: {
    width: 32,
    alignItems: "center",
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowLabels: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  rowSublabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timeValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Time Picker
  pickerContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  pickerDoneButton: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // Day Picker
  dayPickerContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  dayOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  dayOptionSelected: {
    backgroundColor: COLORS.primary + "08",
  },
  dayOptionText: {
    fontSize: 15,
    color: COLORS.text,
  },
  dayOptionTextSelected: {
    fontWeight: "600",
    color: COLORS.primary,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },

  // Bottom spacer
  bottomSpacer: {
    height: 40,
  },
});
