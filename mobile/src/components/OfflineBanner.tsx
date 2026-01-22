import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  addSyncQueueListener,
  hasQueuedItems,
  isQueueProcessing,
} from "@/services/syncQueue";
import { COLORS } from "@/theme/colors";

/**
 * Sync status states
 */
type SyncStatus = "online" | "offline" | "syncing" | "synced";

/**
 * Duration to show "Synced ✓" before hiding (in ms)
 */
const SYNCED_DISPLAY_DURATION = 2000;

/**
 * OfflineBanner displays the current network/sync status
 * - Shows "You're offline" when disconnected
 * - Shows "Syncing..." when processing queue
 * - Shows "Synced ✓" briefly after successful sync
 */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { isConnected, isLoading } = useNetworkStatus();

  // Animation value for slide in/out
  const slideAnim = useRef(new Animated.Value(-100)).current;

  // Current sync status
  const [status, setStatus] = useState<SyncStatus>("online");

  // Timer ref for hiding synced message
  const syncedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if banner is currently visible
  const [isVisible, setIsVisible] = useState(false);

  // Clear synced timer on unmount
  useEffect(() => {
    return () => {
      if (syncedTimerRef.current) {
        clearTimeout(syncedTimerRef.current);
      }
    };
  }, []);

  // Update status based on network state
  useEffect(() => {
    if (isLoading) return;

    if (!isConnected) {
      setStatus("offline");
    } else if (isQueueProcessing()) {
      setStatus("syncing");
    } else if (hasQueuedItems()) {
      // Has items but not processing yet - will start soon
      setStatus("syncing");
    } else if (status === "offline" || status === "syncing") {
      // Was offline or syncing, now online with empty queue
      // Don't show synced if we were never offline
      setStatus("online");
    }
  }, [isConnected, isLoading, status]);

  // Listen for sync queue events
  useEffect(() => {
    const unsubscribe = addSyncQueueListener((event) => {
      if (event === "start") {
        // Clear any pending synced timer
        if (syncedTimerRef.current) {
          clearTimeout(syncedTimerRef.current);
          syncedTimerRef.current = null;
        }
        setStatus("syncing");
      } else if (event === "complete") {
        // Only show "Synced" if we were syncing
        if (status === "syncing" || status === "offline") {
          setStatus("synced");

          // Hide after delay
          syncedTimerRef.current = setTimeout(() => {
            setStatus("online");
            syncedTimerRef.current = null;
          }, SYNCED_DISPLAY_DURATION);
        }
      } else if (event === "error") {
        // Keep showing syncing status on error (will retry)
        // Or show offline if no connection
        if (!isConnected) {
          setStatus("offline");
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, status]);

  // Determine if banner should be visible
  const shouldShowBanner = status !== "online";

  // Animate banner visibility
  useEffect(() => {
    if (shouldShowBanner && !isVisible) {
      // Slide in
      setIsVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    } else if (!shouldShowBanner && isVisible) {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [shouldShowBanner, isVisible, slideAnim]);

  // Don't render anything if not visible and animation complete
  if (!isVisible && !shouldShowBanner) {
    return null;
  }

  // Get banner content based on status
  const getBannerContent = (): {
    text: string;
    icon: keyof typeof Ionicons.glyphMap;
    backgroundColor: string;
    showSpinner: boolean;
  } => {
    switch (status) {
      case "offline":
        return {
          text: "You're offline. Changes will sync when connected.",
          icon: "cloud-offline-outline",
          backgroundColor: COLORS.warning,
          showSpinner: false,
        };
      case "syncing":
        return {
          text: "Syncing...",
          icon: "cloud-upload-outline",
          backgroundColor: COLORS.info,
          showSpinner: true,
        };
      case "synced":
        return {
          text: "Synced ✓",
          icon: "checkmark-circle-outline",
          backgroundColor: COLORS.success,
          showSpinner: false,
        };
      default:
        return {
          text: "",
          icon: "cloud-outline",
          backgroundColor: COLORS.info,
          showSpinner: false,
        };
    }
  };

  const content = getBannerContent();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          paddingTop: insets.top,
          backgroundColor: content.backgroundColor,
        },
      ]}
    >
      <View style={styles.content}>
        {content.showSpinner ? (
          <ActivityIndicator size="small" color={COLORS.textOnPrimary} />
        ) : (
          <Ionicons
            name={content.icon}
            size={18}
            color={COLORS.textOnPrimary}
          />
        )}
        <Text style={styles.text}>{content.text}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: COLORS.textOnPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
});
