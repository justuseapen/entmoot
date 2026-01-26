import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores";

/**
 * Root index route - redirects to appropriate screen based on auth state
 */
export default function Index() {
  const { isAuthenticated, isInitialized } = useAuthStore();

  // While auth is initializing, the _layout will show a loading spinner
  // Once initialized, redirect based on auth state
  if (!isInitialized) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/today" />;
  }

  return <Redirect href="/(auth)/login" />;
}
