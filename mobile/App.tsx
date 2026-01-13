import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { RootNavigator } from "./src/navigation";
import { useAuthStore } from "./src/stores";
import { usePushNotifications } from "./src/hooks";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  creamWhite: "#FFF8E7",
};

/**
 * Component that sets up push notifications when user is authenticated
 * This must be rendered inside NavigationContainer for deep linking to work
 */
function PushNotificationHandler() {
  // Set up push notification listeners
  // autoRegister is handled by the auth store on login/register
  usePushNotifications({
    onNotificationReceived: (notification) => {
      // Log received notifications for debugging
      console.log("Push notification received:", notification.request.content);
    },
    onNotificationTapped: (response) => {
      // Deep linking is handled by the hook
      console.log(
        "Push notification tapped:",
        response.notification.request.content
      );
    },
  });

  // This component doesn't render anything visible
  return null;
}

function AppContent() {
  const { isAuthenticated, isInitialized, isLoading, initialize } =
    useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading screen while initializing auth state
  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.forestGreen} />
      </View>
    );
  }

  return (
    <>
      {isAuthenticated && <PushNotificationHandler />}
      <RootNavigator isAuthenticated={isAuthenticated} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppContent />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.creamWhite,
  },
});
