import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { RootNavigator } from "./src/navigation";
import { useAuthStore } from "./src/stores";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  creamWhite: "#FFF8E7",
};

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

  return <RootNavigator isAuthenticated={isAuthenticated} />;
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
