import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Modal,
  Platform,
  Alert,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Constants from "expo-constants";
import type { MainTabScreenProps } from "../../navigation/types";
import { useAuthStore } from "../../stores";
import { getFamilies } from "../../lib/families";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  formatTimeDisplay,
  parseTimeToDate,
  formatDateToTime,
  DAYS_OF_WEEK,
  INACTIVITY_THRESHOLD_OPTIONS,
  CHECK_IN_FREQUENCIES,
  isDailyFrequency,
  isWeeklyOrMoreFrequent,
  type NotificationPreferences,
  type UpdateNotificationPreferencesData,
  type CheckInFrequency,
} from "../../lib/notificationPreferences";
import type { Family } from "@shared/types";

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

type Props = MainTabScreenProps<"Settings">;

// Helper function for user initials - defined outside component
function getInitials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function SettingsScreen(_props: Props) {
  // Suppress unused parameter warning
  void _props;

  const { user, logout, isLoading: authLoading } = useAuthStore();
  const [families, setFamilies] = useState<Family[]>([]);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerField, setTimePickerField] = useState<
    "morning" | "evening" | "weekly" | "quiet_start" | "quiet_end" | null
  >(null);
  const [tempTime, setTempTime] = useState(new Date());

  // Day picker state
  const [showDayPicker, setShowDayPicker] = useState(false);

  // Check-in frequency picker state
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  // Inactivity threshold picker state
  const [showInactivityThresholdPicker, setShowInactivityThresholdPicker] =
    useState(false);

  const loadData = useCallback(async () => {
    try {
      const [familiesRes, prefsRes] = await Promise.all([
        getFamilies(),
        getNotificationPreferences(),
      ]);
      setFamilies(familiesRes.families);
      setPrefs(prefsRes.notification_preferences);
    } catch (error) {
      console.error("Failed to load settings data:", error);
    }
  }, []);

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

  const handleUpdate = async (updates: UpdateNotificationPreferencesData) => {
    if (!prefs) return;
    setIsSaving(true);
    try {
      const result = await updateNotificationPreferences(updates);
      setPrefs(result.notification_preferences);
    } catch (error) {
      console.error("Failed to update preferences:", error);
      Alert.alert("Error", "Failed to save preferences. Please try again.");
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const openTimePicker = (
    field: "morning" | "evening" | "weekly" | "quiet_start" | "quiet_end"
  ) => {
    if (!prefs) return;
    let time: string;
    switch (field) {
      case "morning":
        time = prefs.reminders.morning_planning.time;
        break;
      case "evening":
        time = prefs.reminders.evening_reflection.time;
        break;
      case "weekly":
        time = prefs.reminders.weekly_review.time;
        break;
      case "quiet_start":
        time = prefs.quiet_hours.start;
        break;
      case "quiet_end":
        time = prefs.quiet_hours.end;
        break;
    }
    setTempTime(parseTimeToDate(time));
    setTimePickerField(field);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: unknown, selectedDate?: Date) => {
    // On Android, the picker closes automatically
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    // For Android, event type is "dismissed" if user cancelled
    const androidEvent = event as { type?: string };
    if (androidEvent?.type === "dismissed") {
      return;
    }

    if (selectedDate) {
      setTempTime(selectedDate);

      // On Android, save immediately
      if (Platform.OS === "android") {
        saveTime(selectedDate);
      }
    }
  };

  const saveTime = (date: Date = tempTime) => {
    const timeStr = formatDateToTime(date);
    switch (timePickerField) {
      case "morning":
        handleUpdate({ morning_planning_time: timeStr });
        break;
      case "evening":
        handleUpdate({ evening_reflection_time: timeStr });
        break;
      case "weekly":
        handleUpdate({ weekly_review_time: timeStr });
        break;
      case "quiet_start":
        handleUpdate({ quiet_hours_start: timeStr });
        break;
      case "quiet_end":
        handleUpdate({ quiet_hours_end: timeStr });
        break;
    }
    setShowTimePicker(false);
  };

  const handleDaySelect = (day: number) => {
    handleUpdate({ weekly_review_day: day });
    setShowDayPicker(false);
  };

  const currentFamily = families[0]; // Primary family
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.forestGreen} />
        <Text style={styles.loadingText}>Loading settings...</Text>
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
      {/* User Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {getInitials(user?.name)}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || "User"}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Family Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Family</Text>
        <View style={styles.card}>
          {currentFamily ? (
            <View style={styles.familyRow}>
              <Text style={styles.familyName}>{currentFamily.name}</Text>
              <Text style={styles.familyTimezone}>
                {currentFamily.timezone}
              </Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No family yet</Text>
          )}
        </View>
      </View>

      {/* Notification Channels Section */}
      {prefs && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Channels</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>In-App</Text>
                <Text style={styles.settingDescription}>
                  Show notifications in the app
                </Text>
              </View>
              <Switch
                value={prefs.channels.in_app}
                onValueChange={(value) => handleUpdate({ in_app: value })}
                trackColor={{ false: "#D1D5DB", true: COLORS.leafGreen }}
                thumbColor={
                  prefs.channels.in_app ? COLORS.forestGreen : "#F3F4F6"
                }
                disabled={isSaving}
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Email</Text>
                <Text style={styles.settingDescription}>
                  Receive reminders via email
                </Text>
              </View>
              <Switch
                value={prefs.channels.email}
                onValueChange={(value) => handleUpdate({ email: value })}
                trackColor={{ false: "#D1D5DB", true: COLORS.leafGreen }}
                thumbColor={
                  prefs.channels.email ? COLORS.forestGreen : "#F3F4F6"
                }
                disabled={isSaving}
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push</Text>
                <Text style={styles.settingDescription}>
                  Receive push notifications
                </Text>
              </View>
              <Switch
                value={prefs.channels.push}
                onValueChange={(value) => handleUpdate({ push: value })}
                trackColor={{ false: "#D1D5DB", true: COLORS.leafGreen }}
                thumbColor={
                  prefs.channels.push ? COLORS.forestGreen : "#F3F4F6"
                }
                disabled={isSaving}
              />
            </View>
          </View>
        </View>
      )}

      {/* Reminder Preferences Section */}
      {prefs && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          <View style={styles.card}>
            {/* Morning Planning */}
            <View style={styles.reminderRow}>
              <View style={styles.reminderMain}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Morning Planning</Text>
                  <Text style={styles.settingDescription}>
                    Daily reminder to plan your day
                  </Text>
                </View>
                <Switch
                  value={prefs.reminders.morning_planning.enabled}
                  onValueChange={(value) =>
                    handleUpdate({ morning_planning: value })
                  }
                  trackColor={{ false: "#D1D5DB", true: COLORS.leafGreen }}
                  thumbColor={
                    prefs.reminders.morning_planning.enabled
                      ? COLORS.forestGreen
                      : "#F3F4F6"
                  }
                  disabled={isSaving}
                />
              </View>
              {prefs.reminders.morning_planning.enabled && (
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => openTimePicker("morning")}
                >
                  <Text style={styles.timeButtonLabel}>Time:</Text>
                  <Text style={styles.timeButtonValue}>
                    {formatTimeDisplay(prefs.reminders.morning_planning.time)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.settingDivider} />

            {/* Evening Reflection */}
            <View style={styles.reminderRow}>
              <View style={styles.reminderMain}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Evening Reflection</Text>
                  <Text style={styles.settingDescription}>
                    Daily reminder to reflect
                  </Text>
                </View>
                <Switch
                  value={prefs.reminders.evening_reflection.enabled}
                  onValueChange={(value) =>
                    handleUpdate({ evening_reflection: value })
                  }
                  trackColor={{ false: "#D1D5DB", true: COLORS.leafGreen }}
                  thumbColor={
                    prefs.reminders.evening_reflection.enabled
                      ? COLORS.forestGreen
                      : "#F3F4F6"
                  }
                  disabled={isSaving}
                />
              </View>
              {prefs.reminders.evening_reflection.enabled && (
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => openTimePicker("evening")}
                >
                  <Text style={styles.timeButtonLabel}>Time:</Text>
                  <Text style={styles.timeButtonValue}>
                    {formatTimeDisplay(prefs.reminders.evening_reflection.time)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.settingDivider} />

            {/* Weekly Review */}
            <View style={styles.reminderRow}>
              <View style={styles.reminderMain}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Weekly Review</Text>
                  <Text style={styles.settingDescription}>
                    Weekly progress reminder
                  </Text>
                </View>
                <Switch
                  value={prefs.reminders.weekly_review.enabled}
                  onValueChange={(value) =>
                    handleUpdate({ weekly_review: value })
                  }
                  trackColor={{ false: "#D1D5DB", true: COLORS.leafGreen }}
                  thumbColor={
                    prefs.reminders.weekly_review.enabled
                      ? COLORS.forestGreen
                      : "#F3F4F6"
                  }
                  disabled={isSaving}
                />
              </View>
              {prefs.reminders.weekly_review.enabled && (
                <View style={styles.weeklyReviewOptions}>
                  <TouchableOpacity
                    style={styles.dayButton}
                    onPress={() => setShowDayPicker(true)}
                  >
                    <Text style={styles.timeButtonLabel}>Day:</Text>
                    <Text style={styles.timeButtonValue}>
                      {
                        DAYS_OF_WEEK.find(
                          (d) => d.value === prefs.reminders.weekly_review.day
                        )?.label
                      }
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => openTimePicker("weekly")}
                  >
                    <Text style={styles.timeButtonLabel}>Time:</Text>
                    <Text style={styles.timeButtonValue}>
                      {formatTimeDisplay(prefs.reminders.weekly_review.time)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Quiet Hours Section */}
      {prefs && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <View style={styles.card}>
            <Text style={styles.quietHoursDescription}>
              Notifications will be silenced during this time
            </Text>
            <View style={styles.quietHoursRow}>
              <TouchableOpacity
                style={styles.quietTimeButton}
                onPress={() => openTimePicker("quiet_start")}
              >
                <Text style={styles.quietTimeLabel}>From</Text>
                <Text style={styles.quietTimeValue}>
                  {formatTimeDisplay(prefs.quiet_hours.start)}
                </Text>
              </TouchableOpacity>
              <Text style={styles.quietHoursTo}>to</Text>
              <TouchableOpacity
                style={styles.quietTimeButton}
                onPress={() => openTimePicker("quiet_end")}
              >
                <Text style={styles.quietTimeLabel}>Until</Text>
                <Text style={styles.quietTimeValue}>
                  {formatTimeDisplay(prefs.quiet_hours.end)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Check-in Frequency Section */}
      {prefs && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Check-in Frequency</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() => setShowFrequencyPicker(true)}
            disabled={isSaving}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>
                  {CHECK_IN_FREQUENCIES.find((f) => f.value === prefs.check_in_frequency)
                    ?.label || "Daily"}
                </Text>
                <Text style={styles.settingDescription}>
                  {CHECK_IN_FREQUENCIES.find((f) => f.value === prefs.check_in_frequency)
                    ?.description || "Choose how often you want reminders"}
                </Text>
              </View>
              <Text style={styles.chevron}>▶</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Re-engagement Reminders Section */}
      {prefs && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Re-engagement Reminders</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Re-engagement</Text>
                <Text style={styles.settingDescription}>
                  Get reminders when you miss check-ins
                </Text>
              </View>
              <Switch
                value={prefs.reengagement?.enabled ?? true}
                onValueChange={(value) =>
                  handleUpdate({ reengagement_enabled: value })
                }
                trackColor={{ false: "#D1D5DB", true: COLORS.leafGreen }}
                thumbColor={
                  prefs.reengagement?.enabled !== false
                    ? COLORS.forestGreen
                    : "#F3F4F6"
                }
                disabled={isSaving}
              />
            </View>

            {prefs.reengagement?.enabled !== false && (
              <>
                <View style={styles.settingDivider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>
                      Missed Check-in Reminders
                    </Text>
                    <Text style={styles.settingDescription}>
                      Remind me if I miss planning or reflection
                    </Text>
                  </View>
                  <Switch
                    value={prefs.reengagement?.missed_checkin_reminder ?? true}
                    onValueChange={(value) =>
                      handleUpdate({ missed_checkin_reminder: value })
                    }
                    trackColor={{ false: "#D1D5DB", true: COLORS.leafGreen }}
                    thumbColor={
                      prefs.reengagement?.missed_checkin_reminder !== false
                        ? COLORS.forestGreen
                        : "#F3F4F6"
                    }
                    disabled={isSaving}
                  />
                </View>

                <View style={styles.settingDivider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Inactivity Reminders</Text>
                    <Text style={styles.settingDescription}>
                      Remind me after a period of inactivity
                    </Text>
                  </View>
                  <Switch
                    value={prefs.reengagement?.inactivity_reminder ?? true}
                    onValueChange={(value) =>
                      handleUpdate({ inactivity_reminder: value })
                    }
                    trackColor={{ false: "#D1D5DB", true: COLORS.leafGreen }}
                    thumbColor={
                      prefs.reengagement?.inactivity_reminder !== false
                        ? COLORS.forestGreen
                        : "#F3F4F6"
                    }
                    disabled={isSaving}
                  />
                </View>

                {prefs.reengagement?.inactivity_reminder !== false && (
                  <>
                    <View style={styles.settingDivider} />

                    <TouchableOpacity
                      style={styles.settingRow}
                      onPress={() => setShowInactivityThresholdPicker(true)}
                    >
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Remind After</Text>
                        <Text style={styles.settingDescription}>
                          How long before you receive an inactivity reminder
                        </Text>
                      </View>
                      <View style={styles.thresholdValue}>
                        <Text style={styles.thresholdText}>
                          {INACTIVITY_THRESHOLD_OPTIONS.find(
                            (opt) =>
                              opt.value ===
                              (prefs.reengagement?.inactivity_threshold_days ?? 7)
                          )?.label ?? "7 days"}
                        </Text>
                        <Text style={styles.chevron}>▶</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      )}

      {/* Logout Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutConfirm(true)}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Text style={styles.logoutButtonText}>Log Out</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Entmoot v{appVersion}</Text>
      </View>

      {/* Time Picker Modal (iOS) */}
      {Platform.OS === "ios" && showTimePicker && (
        <Modal
          visible={showTimePicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => saveTime()}>
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={styles.timePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker (Android - shows as dialog) */}
      {Platform.OS === "android" && showTimePicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* Day Picker Modal */}
      <Modal
        visible={showDayPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDayPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Day</Text>
            {DAYS_OF_WEEK.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayOption,
                  prefs?.reminders.weekly_review.day === day.value &&
                    styles.dayOptionSelected,
                ]}
                onPress={() => handleDaySelect(day.value)}
              >
                <Text
                  style={[
                    styles.dayOptionText,
                    prefs?.reminders.weekly_review.day === day.value &&
                      styles.dayOptionTextSelected,
                  ]}
                >
                  {day.label}
                </Text>
                {prefs?.reminders.weekly_review.day === day.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDayPicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Frequency Picker Modal */}
      <Modal
        visible={showFrequencyPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFrequencyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Check-in Frequency</Text>
            {CHECK_IN_FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq.value}
                style={[
                  styles.dayOption,
                  prefs?.check_in_frequency === freq.value && styles.dayOptionSelected,
                ]}
                onPress={() => {
                  handleUpdate({ check_in_frequency: freq.value as CheckInFrequency });
                  setShowFrequencyPicker(false);
                }}
              >
                <View style={styles.frequencyOption}>
                  <Text
                    style={[
                      styles.dayOptionText,
                      prefs?.check_in_frequency === freq.value &&
                        styles.dayOptionTextSelected,
                    ]}
                  >
                    {freq.label}
                  </Text>
                  <Text style={styles.frequencyDescription}>{freq.description}</Text>
                </View>
                {prefs?.check_in_frequency === freq.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFrequencyPicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Inactivity Threshold Picker Modal */}
      <Modal
        visible={showInactivityThresholdPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInactivityThresholdPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Inactivity Reminder Threshold</Text>
            {INACTIVITY_THRESHOLD_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.dayOption,
                  (prefs?.reengagement?.inactivity_threshold_days ?? 7) ===
                    opt.value && styles.dayOptionSelected,
                ]}
                onPress={() => {
                  handleUpdate({ inactivity_threshold_days: opt.value });
                  setShowInactivityThresholdPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.dayOptionText,
                    (prefs?.reengagement?.inactivity_threshold_days ?? 7) ===
                      opt.value && styles.dayOptionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                {(prefs?.reengagement?.inactivity_threshold_days ?? 7) ===
                  opt.value && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowInactivityThresholdPicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmTitle}>Log Out?</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to log out of Entmoot?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmLogoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.confirmLogoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkForest,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.forestGreen,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.darkForest,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.earthBrown,
  },
  familyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  familyName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.darkForest,
  },
  familyTimezone: {
    fontSize: 14,
    color: COLORS.earthBrown,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.earthBrown,
    textAlign: "center",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.darkForest,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.earthBrown,
  },
  settingDivider: {
    height: 1,
    backgroundColor: `${COLORS.earthBrown}15`,
    marginVertical: 12,
  },
  reminderRow: {
    gap: 8,
  },
  reminderMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.forestGreen}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginLeft: 16,
  },
  timeButtonLabel: {
    fontSize: 14,
    color: COLORS.earthBrown,
    marginRight: 4,
  },
  timeButtonValue: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.forestGreen,
  },
  weeklyReviewOptions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 16,
    marginTop: 4,
  },
  dayButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.forestGreen}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quietHoursDescription: {
    fontSize: 13,
    color: COLORS.earthBrown,
    marginBottom: 12,
  },
  quietHoursRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  quietTimeButton: {
    alignItems: "center",
    backgroundColor: `${COLORS.forestGreen}10`,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
  },
  quietTimeLabel: {
    fontSize: 12,
    color: COLORS.earthBrown,
    marginBottom: 4,
  },
  quietTimeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.forestGreen,
  },
  quietHoursTo: {
    fontSize: 14,
    color: COLORS.earthBrown,
  },
  chevron: {
    fontSize: 12,
    color: COLORS.earthBrown,
  },
  thresholdValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  thresholdText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.forestGreen,
  },
  logoutButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  versionText: {
    fontSize: 13,
    color: COLORS.earthBrown,
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
  dayOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  dayOptionSelected: {
    backgroundColor: `${COLORS.forestGreen}15`,
    borderWidth: 1,
    borderColor: COLORS.forestGreen,
  },
  dayOptionText: {
    fontSize: 16,
    color: COLORS.darkForest,
  },
  dayOptionTextSelected: {
    fontWeight: "600",
    color: COLORS.forestGreen,
  },
  checkmark: {
    fontSize: 18,
    color: COLORS.forestGreen,
    fontWeight: "bold",
  },
  frequencyOption: {
    flex: 1,
  },
  frequencyDescription: {
    fontSize: 12,
    color: COLORS.earthBrown,
    marginTop: 2,
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
  pickerModalContent: {
    backgroundColor: COLORS.creamWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.earthBrown}15`,
  },
  pickerCancel: {
    fontSize: 16,
    color: COLORS.earthBrown,
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.forestGreen,
  },
  timePicker: {
    height: 200,
  },
  confirmModalContent: {
    backgroundColor: COLORS.creamWhite,
    borderRadius: 24,
    padding: 24,
    margin: 24,
    marginTop: "auto",
    marginBottom: "auto",
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.darkForest,
    textAlign: "center",
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 16,
    color: COLORS.earthBrown,
    textAlign: "center",
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: `${COLORS.earthBrown}15`,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.earthBrown,
  },
  confirmLogoutButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  confirmLogoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
