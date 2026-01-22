import { useEffect, useRef, useState, useCallback } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet, AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { useAuthStore } from "@/stores";
import { COLORS, paperThemeColors } from "@/theme/colors";
import { authenticate, shouldPromptBiometric } from "@/services/biometrics";
import { getItem, STORAGE_KEYS } from "@/services/secureStorage";

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

export default function RootLayout() {
  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGuard>
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
          </Stack>
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
