import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { COLORS } from "@/theme/colors";
import { useAuthStore } from "@/stores";
import { api } from "@/lib/api";
import {
  isAvailable as isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  getBiometricType,
} from "@/services/biometrics";

// App version from app.json
const APP_VERSION = "1.0.0";

// External links
const TERMS_URL = "https://entmoot.app/terms";
const PRIVACY_URL = "https://entmoot.app/privacy";

// Types
interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  value?: string;
  showChevron?: boolean;
  textColor?: string;
  disabled?: boolean;
}

interface SwitchRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  sublabel?: string;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

// Setting Row Component
function SettingRow({
  icon,
  label,
  onPress,
  value,
  showChevron = true,
  textColor = COLORS.text,
  disabled = false,
}: SettingRowProps) {
  const handlePress = useCallback(() => {
    if (!disabled && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  }, [disabled, onPress]);

  return (
    <TouchableOpacity
      style={[styles.settingRow, disabled && styles.settingRowDisabled]}
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={styles.settingRowLeft}>
        <View
          style={[
            styles.settingIcon,
            textColor === COLORS.error && styles.settingIconDanger,
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={textColor === COLORS.error ? COLORS.error : COLORS.primary}
          />
        </View>
        <Text style={[styles.settingLabel, { color: textColor }]}>{label}</Text>
      </View>
      <View style={styles.settingRowRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textTertiary}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

// Switch Row Component
function SwitchRow({
  icon,
  label,
  value,
  onValueChange,
  disabled = false,
  sublabel,
}: SwitchRowProps) {
  return (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingRowLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={20} color={COLORS.primary} />
        </View>
        <View>
          <Text style={styles.settingLabel}>{label}</Text>
          {sublabel && <Text style={styles.settingSublabel}>{sublabel}</Text>}
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

// Section Component
function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometric");
  const [loadingBiometric, setLoadingBiometric] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load biometric state on mount
  useEffect(() => {
    async function loadBiometricState() {
      try {
        const available = await isBiometricAvailable();
        setBiometricAvailable(available);

        if (available) {
          const enabled = await isBiometricEnabled();
          setBiometricEnabledState(enabled);

          const type = await getBiometricType();
          setBiometricType(type);
        }
      } catch (error) {
        console.error("[Settings] Failed to load biometric state:", error);
      } finally {
        setLoadingBiometric(false);
      }
    }

    loadBiometricState();
  }, []);

  // Handle biometric toggle
  const handleBiometricToggle = useCallback(
    async (enabled: boolean) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await setBiometricEnabled(enabled);
        setBiometricEnabledState(enabled);

        if (enabled) {
          Alert.alert(
            `${biometricType} Enabled`,
            `You can now use ${biometricType} to unlock Entmoot.`
          );
        }
      } catch (error) {
        console.error("[Settings] Failed to update biometric setting:", error);
        Alert.alert("Error", "Failed to update biometric setting.");
      }
    },
    [biometricType]
  );

  // Navigation handlers
  const handleEditProfile = useCallback(() => {
    router.push("/settings/profile");
  }, [router]);

  const handleChangePassword = useCallback(() => {
    // TODO: Implement change password screen
    Alert.alert(
      "Change Password",
      "Password change functionality will be available soon.",
      [{ text: "OK" }]
    );
  }, []);

  const handleNotifications = useCallback(() => {
    router.push("/settings/notifications");
  }, [router]);

  // External links
  const handleOpenTerms = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const canOpen = await Linking.canOpenURL(TERMS_URL);
      if (canOpen) {
        await Linking.openURL(TERMS_URL);
      } else {
        Alert.alert("Error", "Unable to open Terms of Service.");
      }
    } catch (error) {
      console.error("[Settings] Failed to open terms:", error);
      Alert.alert("Error", "Unable to open Terms of Service.");
    }
  }, []);

  const handleOpenPrivacy = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const canOpen = await Linking.canOpenURL(PRIVACY_URL);
      if (canOpen) {
        await Linking.openURL(PRIVACY_URL);
      } else {
        Alert.alert("Error", "Unable to open Privacy Policy.");
      }
    } catch (error) {
      console.error("[Settings] Failed to open privacy:", error);
      Alert.alert("Error", "Unable to open Privacy Policy.");
    }
  }, []);

  // Delete account handler
  const handleDeleteAccount = useCallback(async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            // Second confirmation
            Alert.alert(
              "Confirm Deletion",
              "This will permanently delete your account and all associated data. Type DELETE to confirm.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete My Account",
                  style: "destructive",
                  onPress: async () => {
                    setIsDeleting(true);
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Warning
                    );

                    try {
                      await api.del("/users/me");
                      await logout();
                      router.replace("/(auth)/login");

                      Alert.alert(
                        "Account Deleted",
                        "Your account has been successfully deleted."
                      );
                    } catch (error) {
                      console.error(
                        "[Settings] Failed to delete account:",
                        error
                      );
                      Alert.alert(
                        "Error",
                        "Failed to delete account. Please try again or contact support."
                      );
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [logout, router]);

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <Section title="Account">
          <SettingRow
            icon="person-outline"
            label="Edit Profile"
            onPress={handleEditProfile}
          />
          <SettingRow
            icon="lock-closed-outline"
            label="Change Password"
            onPress={handleChangePassword}
          />
        </Section>

        {/* Notifications Section */}
        <Section title="Notifications">
          <SettingRow
            icon="notifications-outline"
            label="Notification Settings"
            onPress={handleNotifications}
          />
        </Section>

        {/* Security Section */}
        <Section title="Security">
          {loadingBiometric ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>
                Loading security settings...
              </Text>
            </View>
          ) : biometricAvailable ? (
            <SwitchRow
              icon="finger-print"
              label={`${biometricType} Login`}
              sublabel={`Use ${biometricType} to unlock Entmoot`}
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
            />
          ) : (
            <View style={styles.unavailableRow}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="finger-print"
                  size={20}
                  color={COLORS.textTertiary}
                />
              </View>
              <View>
                <Text style={styles.unavailableLabel}>Biometric Login</Text>
                <Text style={styles.unavailableSublabel}>
                  Not available on this device
                </Text>
              </View>
            </View>
          )}
        </Section>

        {/* About Section */}
        <Section title="About">
          <SettingRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={handleOpenTerms}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={handleOpenPrivacy}
          />
          <SettingRow
            icon="information-circle-outline"
            label="Version"
            value={APP_VERSION}
            showChevron={false}
          />
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone">
          {isDeleting ? (
            <View style={styles.deletingRow}>
              <ActivityIndicator size="small" color={COLORS.error} />
              <Text style={styles.deletingText}>Deleting account...</Text>
            </View>
          ) : (
            <SettingRow
              icon="trash-outline"
              label="Delete Account"
              onPress={handleDeleteAccount}
              textColor={COLORS.error}
              showChevron={false}
            />
          )}
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

  // Setting Row
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingIconDanger: {
    backgroundColor: COLORS.error + "10",
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  settingSublabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Loading/Unavailable rows
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  unavailableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    opacity: 0.5,
  },
  unavailableLabel: {
    fontSize: 16,
    color: COLORS.textTertiary,
  },
  unavailableSublabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // Deleting row
  deletingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  deletingText: {
    fontSize: 14,
    color: COLORS.error,
  },

  // Bottom spacer
  bottomSpacer: {
    height: 40,
  },
});
