import { useEffect, useRef, useState, useCallback } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet, AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "@/stores";
import { COLORS, paperThemeColors } from "@/theme/colors";
import { authenticate, shouldPromptBiometric } from "@/services/biometrics";
import { getItem, STORAGE_KEYS } from "@/services/secureStorage";
import {
  InAppNotificationBanner,
  parseNotificationPayload,
  getNotificationRoute,
  OfflineBanner,
  type NotificationPayload,
} from "@/components";

// Configure React Native Paper theme
const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...paperThemeColors,
  },
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, isLoading, initialize, logout } =
    useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Biometric authentication state
  const [biometricLocked, setBiometricLocked] = useState(false);
  const [biometricChecked, setBiometricChecked] = useState(false);
  const appState = useRef(AppState.currentState);
  const biometricPromptShown = useRef(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Check if biometric prompt should be shown on initial load
  const checkInitialBiometric = useCallback(async () => {
    if (biometricChecked) return;

    const hasSession = await getItem(STORAGE_KEYS.SESSION_TOKEN);
    const shouldPrompt = await shouldPromptBiometric(!!hasSession);

    if (shouldPrompt && !biometricPromptShown.current) {
      biometricPromptShown.current = true;
      setBiometricLocked(true);

      const success = await authenticate();
      if (success) {
        setBiometricLocked(false);
      } else {
        // If biometric fails, redirect to login
        await logout();
        setBiometricLocked(false);
        router.replace("/(auth)/login");
      }
    }

    setBiometricChecked(true);
  }, [biometricChecked, logout, router]);

  // Check biometric on app initialization
  useEffect(() => {
    if (isInitialized && !isLoading) {
      checkInitialBiometric();
    }
  }, [isInitialized, isLoading, checkInitialBiometric]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        // App came to foreground from background
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          const hasSession = await getItem(STORAGE_KEYS.SESSION_TOKEN);
          const shouldPrompt = await shouldPromptBiometric(!!hasSession);

          if (shouldPrompt && isAuthenticated) {
            setBiometricLocked(true);
            biometricPromptShown.current = true;

            const success = await authenticate();
            if (success) {
              setBiometricLocked(false);
            } else {
              // If biometric fails, redirect to login
              await logout();
              setBiometricLocked(false);
              router.replace("/(auth)/login");
            }
          }
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, logout, router]);

  useEffect(() => {
    if (!isInitialized || isLoading || biometricLocked) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not already in auth group
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main tabs if authenticated and in auth group
      router.replace("/(tabs)/today");
    }
  }, [
    isAuthenticated,
    isInitialized,
    isLoading,
    biometricLocked,
    segments,
    router,
  ]);

  // Show loading screen while initializing auth state or during biometric check
  if (!isInitialized || isLoading || biometricLocked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Notification handler component that manages notification listeners
 * and displays the in-app notification banner
 */
function NotificationHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // State for in-app notification banner
  const [currentNotification, setCurrentNotification] = useState<{
    title: string;
    body: string;
    payload: NotificationPayload;
  } | null>(null);

  // Ref to store notification response for navigation
  const notificationResponseRef = useRef<NotificationPayload | null>(null);

  // Handle navigation to a specific route from notification
  const handleNotificationNavigation = useCallback(
    (payload: NotificationPayload) => {
      if (!isAuthenticated) {
        // Store for later navigation after auth
        notificationResponseRef.current = payload;
        return;
      }

      const routeInfo = getNotificationRoute(payload);
      if (routeInfo) {
        // Use type assertion for params since expo-router types are strict
        if (routeInfo.params) {
          const path = routeInfo.route.replace(
            "[id]",
            String(routeInfo.params.id || "")
          );
          router.push(path as never);
        } else {
          router.push(routeInfo.route as never);
        }
      }
    },
    [isAuthenticated, router]
  );

  // Handle notification received while app is in foreground
  const handleForegroundNotification = useCallback(
    (notification: Notifications.Notification) => {
      const content = notification.request.content;
      const data = content.data as Record<string, unknown> | undefined;
      const payload = parseNotificationPayload(data);

      // Show in-app banner
      setCurrentNotification({
        title: content.title || "Notification",
        body: content.body || "",
        payload: {
          ...payload,
          title: content.title || payload.title,
          body: content.body || payload.body,
        },
      });
    },
    []
  );

  // Handle notification response (user tapped notification)
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const content = response.notification.request.content;
      const data = content.data as Record<string, unknown> | undefined;
      const payload = parseNotificationPayload(data);

      // Navigate to appropriate screen
      handleNotificationNavigation({
        ...payload,
        title: content.title || payload.title,
        body: content.body || payload.body,
      });
    },
    [handleNotificationNavigation]
  );

  // Set up notification listeners
  useEffect(() => {
    // Listener for foreground notifications
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      handleForegroundNotification
    );

    // Listener for notification responses (tapped)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

    // Check for cold start notification (app opened from notification)
    const checkColdStartNotification = async () => {
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        handleNotificationResponse(lastResponse);
      }
    };

    checkColdStartNotification();

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [handleForegroundNotification, handleNotificationResponse]);

  // Handle pending notification after authentication
  useEffect(() => {
    if (isAuthenticated && notificationResponseRef.current) {
      handleNotificationNavigation(notificationResponseRef.current);
      notificationResponseRef.current = null;
    }
  }, [isAuthenticated, handleNotificationNavigation]);

  // Handle banner press
  const handleBannerPress = useCallback(() => {
    if (currentNotification) {
      handleNotificationNavigation(currentNotification.payload);
    }
  }, [currentNotification, handleNotificationNavigation]);

  // Handle banner dismiss
  const handleBannerDismiss = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  return (
    <>
      {children}
      <OfflineBanner />
      <InAppNotificationBanner
        notification={currentNotification}
        onPress={handleBannerPress}
        onDismiss={handleBannerDismiss}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGuard>
          <NotificationHandler>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: COLORS.background,
                },
                headerTintColor: COLORS.secondary,
                headerTitleStyle: {
                  fontWeight: "600",
                },
                contentStyle: {
                  backgroundColor: COLORS.background,
                },
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="onboarding/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="settings/index"
                options={{ title: "Settings" }}
              />
              <Stack.Screen
                name="settings/habits"
                options={{ title: "Manage Habits" }}
              />
              <Stack.Screen
                name="goal/[id]"
                options={{ title: "Goal Details" }}
              />
              <Stack.Screen
                name="goal/create"
                options={{ title: "Create Goal" }}
              />
              <Stack.Screen
                name="reflection/quick"
                options={{ title: "Quick Reflection" }}
              />
              <Stack.Screen
                name="reflection/weekly"
                options={{ title: "Weekly Review" }}
              />
              <Stack.Screen
                name="settings/profile"
                options={{ title: "Edit Profile" }}
              />
              <Stack.Screen
                name="settings/family"
                options={{ title: "Family" }}
              />
              <Stack.Screen
                name="settings/notifications"
                options={{ title: "Notifications" }}
              />
            </Stack>
          </NotificationHandler>
        </AuthGuard>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});
