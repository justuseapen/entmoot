import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { useAuthStore } from "@/stores";
import { COLORS, paperThemeColors } from "@/theme/colors";

// Configure React Native Paper theme
const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...paperThemeColors,
  },
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, isLoading, initialize } =
    useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not already in auth group
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main tabs if authenticated and in auth group
      router.replace("/(tabs)/today");
    }
  }, [isAuthenticated, isInitialized, isLoading, segments, router]);

  // Show loading screen while initializing auth state
  if (!isInitialized || isLoading) {
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
              name="goal/[id]"
              options={{ title: "Goal Details" }}
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
