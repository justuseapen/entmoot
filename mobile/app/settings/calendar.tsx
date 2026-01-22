import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";

import { COLORS } from "@/theme/colors";
import {
  useGoogleCalendarConnection,
  useFetchAuthUrl,
  useDisconnectGoogleCalendar,
  useConnectGoogleCalendar,
  type GoogleCalendar,
} from "@/hooks/useGoogleCalendar";

// Deep link URL for OAuth callback
const GOOGLE_CALLBACK_URL = "entmoot://google-callback";

// Section Component (reused from settings/index.tsx)
interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description && (
        <Text style={styles.sectionDescription}>{description}</Text>
      )}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

// Calendar Item Component
interface CalendarItemProps {
  calendar: GoogleCalendar;
}

function CalendarItem({ calendar }: CalendarItemProps) {
  return (
    <View style={styles.calendarItem}>
      <View
        style={[
          styles.calendarColorDot,
          { backgroundColor: calendar.color || COLORS.primary },
        ]}
      />
      <View style={styles.calendarInfo}>
        <Text style={styles.calendarName}>{calendar.name}</Text>
        {calendar.primary && (
          <Text style={styles.calendarPrimaryBadge}>Primary</Text>
        )}
      </View>
    </View>
  );
}

export default function CalendarSettingsScreen() {
  const router = useRouter();

  // State for OAuth flow
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingOAuthCode, setPendingOAuthCode] = useState<string | null>(null);

  // Hooks for Google Calendar
  const {
    data: connection,
    isLoading: isLoadingConnection,
    isError: isConnectionError,
    refetch: refetchConnection,
  } = useGoogleCalendarConnection();

  const fetchAuthUrl = useFetchAuthUrl();
  const disconnectCalendar = useDisconnectGoogleCalendar();
  const connectCalendar = useConnectGoogleCalendar();

  // Handle deep link callback from OAuth
  useEffect(() => {
    // Listen for deep links
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      if (url.startsWith(GOOGLE_CALLBACK_URL)) {
        // Parse the code from the URL
        const params = new URLSearchParams(url.split("?")[1]);
        const code = params.get("code");
        if (code) {
          setPendingOAuthCode(code);
        } else {
          const error = params.get("error");
          if (error) {
            Alert.alert(
              "Connection Failed",
              "Unable to connect Google Calendar. Please try again."
            );
          }
        }
        setIsConnecting(false);
      }
    };

    // Set up listener
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check for initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Process pending OAuth code
  useEffect(() => {
    if (pendingOAuthCode) {
      connectCalendar.mutate(pendingOAuthCode, {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            "Connected",
            "Your Google Calendar has been connected successfully."
          );
          setPendingOAuthCode(null);
        },
        onError: (error) => {
          console.error(
            "[CalendarSettings] Failed to connect calendar:",
            error
          );
          Alert.alert(
            "Connection Failed",
            "Unable to connect Google Calendar. Please try again."
          );
          setPendingOAuthCode(null);
        },
      });
    }
  }, [pendingOAuthCode, connectCalendar]);

  // Handle connect button press
  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Fetch the OAuth URL
      const result = await fetchAuthUrl.mutateAsync();
      const authUrl = result;

      if (!authUrl) {
        throw new Error("No auth URL received");
      }

      // Open the OAuth URL in browser
      const result2 = await WebBrowser.openAuthSessionAsync(
        authUrl,
        GOOGLE_CALLBACK_URL
      );

      if (result2.type === "cancel" || result2.type === "dismiss") {
        setIsConnecting(false);
      }
      // If successful, the deep link handler will process the callback
    } catch (error) {
      console.error("[CalendarSettings] Failed to start OAuth flow:", error);
      Alert.alert(
        "Error",
        "Unable to start Google Calendar connection. Please try again."
      );
      setIsConnecting(false);
    }
  }, [fetchAuthUrl]);

  // Handle disconnect button press
  const handleDisconnect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "Disconnect Google Calendar",
      "Are you sure you want to disconnect your Google Calendar? Your calendar events will no longer sync with Entmoot.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await disconnectCalendar.mutateAsync();
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert(
                "Disconnected",
                "Your Google Calendar has been disconnected."
              );
            } catch (error) {
              console.error(
                "[CalendarSettings] Failed to disconnect calendar:",
                error
              );
              Alert.alert(
                "Error",
                "Unable to disconnect Google Calendar. Please try again."
              );
            }
          },
        },
      ]
    );
  }, [disconnectCalendar]);

  // Render loading state
  if (isLoadingConnection) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
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
          <Text style={styles.headerTitle}>Calendar</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading calendar settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (isConnectionError) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
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
          <Text style={styles.headerTitle}>Calendar</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={COLORS.error}
          />
          <Text style={styles.errorText}>
            Unable to load calendar settings.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetchConnection()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isConnected = connection?.connected;
  const connectedEmail = connection?.email;
  const syncedCalendars = connection?.calendars || [];

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
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Google Calendar Connection Section */}
        <Section
          title="Google Calendar"
          description="Connect your Google Calendar to sync events with your daily planning."
        >
          {/* Connection Status */}
          <View style={styles.connectionStatus}>
            <View style={styles.connectionStatusLeft}>
              <View
                style={[
                  styles.statusIcon,
                  isConnected ? styles.statusIconConnected : styles.statusIconDisconnected,
                ]}
              >
                <Ionicons
                  name={isConnected ? "checkmark-circle" : "close-circle"}
                  size={24}
                  color={isConnected ? COLORS.success : COLORS.textTertiary}
                />
              </View>
              <View>
                <Text style={styles.statusLabel}>
                  {isConnected ? "Connected" : "Not Connected"}
                </Text>
                {isConnected && connectedEmail && (
                  <Text style={styles.statusEmail}>{connectedEmail}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Connect/Disconnect Button */}
          {isConnected ? (
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
              disabled={disconnectCalendar.isPending}
            >
              {disconnectCalendar.isPending ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <>
                  <Ionicons
                    name="unlink-outline"
                    size={20}
                    color={COLORS.error}
                  />
                  <Text style={styles.disconnectButtonText}>Disconnect</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnect}
              disabled={isConnecting || connectCalendar.isPending}
            >
              {isConnecting || connectCalendar.isPending ? (
                <ActivityIndicator size="small" color={COLORS.surface} />
              ) : (
                <>
                  <Ionicons
                    name="logo-google"
                    size={20}
                    color={COLORS.surface}
                  />
                  <Text style={styles.connectButtonText}>
                    Connect Google Calendar
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Section>

        {/* Synced Calendars Section (only show when connected) */}
        {isConnected && syncedCalendars.length > 0 && (
          <Section title="Synced Calendars">
            {syncedCalendars.map((calendar) => (
              <CalendarItem key={calendar.id} calendar={calendar} />
            ))}
          </Section>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <Text style={styles.infoText}>
            {isConnected
              ? "Your Google Calendar events will appear in your Today view. Goal deadlines can be synced to your calendar."
              : "Connect your Google Calendar to see events in your Today view and sync goal deadlines."}
          </Text>
        </View>

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
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
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
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    paddingHorizontal: 4,
    lineHeight: 20,
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
    padding: 16,
  },

  // Connection status
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  connectionStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIconConnected: {
    backgroundColor: COLORS.success + "20",
  },
  statusIconDisconnected: {
    backgroundColor: COLORS.border,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  statusEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Connect button
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
  },

  // Disconnect button
  disconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.error + "10",
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingVertical: 14,
    borderRadius: 8,
  },
  disconnectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.error,
  },

  // Calendar item
  calendarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  calendarColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  calendarInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarName: {
    fontSize: 16,
    color: COLORS.text,
  },
  calendarPrimaryBadge: {
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },

  // Info section
  infoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 24,
    paddingHorizontal: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Bottom spacer
  bottomSpacer: {
    height: 40,
  },
});
