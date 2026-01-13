import { useEffect, useRef, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import type { RootStackParamList } from "../navigation/types";
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  removeNotificationSubscription,
  getLastNotificationResponse,
  getNotificationData,
  parseNotificationLink,
} from "../lib/pushNotifications";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UsePushNotificationsOptions {
  /**
   * Whether to automatically register for push notifications
   * This should be true when the user is authenticated
   */
  autoRegister?: boolean;

  /**
   * Callback when a notification is received in foreground
   */
  onNotificationReceived?: (notification: Notifications.Notification) => void;

  /**
   * Callback when the user taps a notification
   */
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void;
}

/**
 * Hook to manage push notifications in the app
 * Handles registration, foreground notifications, and notification taps with deep linking
 */
export function usePushNotifications(
  options: UsePushNotificationsOptions = {}
): {
  registerForPushNotifications: () => Promise<boolean>;
} {
  const {
    autoRegister = false,
    onNotificationReceived,
    onNotificationTapped,
  } = options;

  const navigation = useNavigation<NavigationProp>();
  const notificationReceivedRef = useRef<Notifications.Subscription | null>(
    null
  );
  const notificationResponseRef = useRef<Notifications.Subscription | null>(
    null
  );

  /**
   * Handle navigation from a notification link
   */
  const navigateFromNotification = useCallback(
    (link: string | null | undefined) => {
      const route = parseNotificationLink(link);
      if (!route) {
        return;
      }

      try {
        // Navigate to the parsed route
        // We need to handle nested navigation params
        if (route.screen === "Main" && route.params?.screen) {
          // For tab navigation, we need to navigate to Main first, then to the tab
          navigation.navigate("Main", {
            screen: route.params.screen as keyof RootStackParamList["Main"],
          } as never);
        } else if (route.screen === "GoalDetail" && route.params?.goalId) {
          navigation.navigate("GoalDetail", {
            goalId: route.params.goalId,
          });
        } else if (route.screen === "Notifications") {
          navigation.navigate("Notifications");
        } else if (route.screen === "Profile") {
          navigation.navigate("Profile");
        } else if (route.screen === "CreateGoal") {
          navigation.navigate("CreateGoal");
        } else if (route.screen === "InviteMember") {
          navigation.navigate("InviteMember");
        } else {
          // Default to Main/Dashboard for unknown routes
          navigation.navigate("Main", {
            screen: "Dashboard",
          } as never);
        }
      } catch (error) {
        console.error("Error navigating from notification:", error);
      }
    },
    [navigation]
  );

  /**
   * Handle received notification (foreground)
   */
  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      console.log("Notification received in foreground:", notification);

      // Call the custom handler if provided
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    },
    [onNotificationReceived]
  );

  /**
   * Handle notification response (user tapped notification)
   */
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      console.log("Notification tapped:", response);

      // Get notification data
      const { link } = getNotificationData(response.notification);

      // Navigate to the relevant screen
      navigateFromNotification(link);

      // Call the custom handler if provided
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    },
    [navigateFromNotification, onNotificationTapped]
  );

  /**
   * Check for notification that launched the app (cold start)
   */
  const checkInitialNotification = useCallback(async () => {
    const response = await getLastNotificationResponse();
    if (response) {
      console.log("App launched from notification:", response);
      const { link } = getNotificationData(response.notification);
      navigateFromNotification(link);
    }
  }, [navigateFromNotification]);

  // Set up notification listeners
  useEffect(() => {
    // Add listener for received notifications (foreground)
    notificationReceivedRef.current = addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Add listener for notification responses (user tapped)
    notificationResponseRef.current = addNotificationResponseListener(
      handleNotificationResponse
    );

    // Check for notification that launched the app
    checkInitialNotification();

    // Cleanup listeners on unmount
    return () => {
      if (notificationReceivedRef.current) {
        removeNotificationSubscription(notificationReceivedRef.current);
      }
      if (notificationResponseRef.current) {
        removeNotificationSubscription(notificationResponseRef.current);
      }
    };
  }, [
    handleNotificationReceived,
    handleNotificationResponse,
    checkInitialNotification,
  ]);

  // Auto-register for push notifications if enabled
  useEffect(() => {
    if (autoRegister) {
      registerForPushNotifications();
    }
  }, [autoRegister]);

  return {
    registerForPushNotifications,
  };
}

export default usePushNotifications;
