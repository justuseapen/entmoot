import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  ListRenderItemInfo,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import {
  usePoints,
  type PointsResponse,
  type RecentActivity,
  getActivityIcon,
  formatRelativeTime,
} from "@/hooks/usePoints";

// Animation duration for counter
const COUNTER_ANIMATION_DURATION = 800;
const COUNTER_FRAME_RATE = 60;

interface AnimatedCounterProps {
  value: number;
  style?: object;
}

function AnimatedCounter({ value, style }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValueRef = useRef(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // If value changed, animate from previous to new value
    if (value !== previousValueRef.current) {
      const startValue = previousValueRef.current;
      const endValue = value;
      const diff = endValue - startValue;

      // If value increased, animate scale for emphasis
      if (diff > 0) {
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Animate counter value
      const totalFrames = Math.ceil(
        (COUNTER_ANIMATION_DURATION / 1000) * COUNTER_FRAME_RATE
      );
      let currentFrame = 0;

      const frameInterval = setInterval(() => {
        currentFrame++;
        const progress = currentFrame / totalFrames;
        // Ease out cubic for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + diff * easeProgress);
        setDisplayValue(currentValue);

        if (currentFrame >= totalFrames) {
          clearInterval(frameInterval);
          setDisplayValue(endValue);
        }
      }, 1000 / COUNTER_FRAME_RATE);

      previousValueRef.current = value;

      return () => clearInterval(frameInterval);
    }
  }, [value, scaleAnim]);

  // Set initial value without animation
  useEffect(() => {
    if (previousValueRef.current === 0 && value > 0) {
      setDisplayValue(value);
      previousValueRef.current = value;
    }
  }, [value]);

  return (
    <Animated.Text style={[style, { transform: [{ scale: scaleAnim }] }]}>
      {displayValue.toLocaleString()}
    </Animated.Text>
  );
}

interface ActivityItemProps {
  activity: RecentActivity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const iconName = getActivityIcon(activity.activity_type) as keyof typeof Ionicons.glyphMap;

  return (
    <View style={styles.activityItem}>
      <View style={styles.activityIconContainer}>
        <Ionicons name={iconName} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityLabel} numberOfLines={1}>
          {activity.activity_label}
        </Text>
        <Text style={styles.activityTime}>
          {formatRelativeTime(activity.created_at)}
        </Text>
      </View>
      <View style={styles.activityPoints}>
        <Text style={styles.activityPointsText}>+{activity.points}</Text>
      </View>
    </View>
  );
}

interface PointsDisplayProps {
  points?: PointsResponse;
  isLoading?: boolean;
  showRecentActivity?: boolean;
  maxActivities?: number;
}

export function PointsDisplay({
  points,
  isLoading,
  showRecentActivity = true,
  maxActivities = 10,
}: PointsDisplayProps) {
  const recentActivities = points?.recent_activity.slice(0, maxActivities) ?? [];

  const renderActivityItem = useCallback(
    ({ item }: ListRenderItemInfo<RecentActivity>) => (
      <ActivityItem activity={item} />
    ),
    []
  );

  const keyExtractor = useCallback(
    (item: RecentActivity) => item.id.toString(),
    []
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Skeleton for main points card */}
        <View style={[styles.mainCard, styles.skeleton]} />
        {/* Skeleton for activity list */}
        {showRecentActivity && (
          <View style={styles.activitySection}>
            <View style={[styles.activityHeader, styles.skeleton]} />
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.activityItemSkeleton, styles.skeleton]} />
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Points Card */}
      <View style={styles.mainCard}>
        <View style={styles.mainPointsSection}>
          <AnimatedCounter
            value={points?.points.total ?? 0}
            style={styles.totalPoints}
          />
          <Text style={styles.totalPointsLabel}>Total Points</Text>
        </View>
        <View style={styles.weekPointsSection}>
          <Text style={styles.weekPointsValue}>
            +{points?.points.this_week ?? 0}
          </Text>
          <Text style={styles.weekPointsLabel}>This Week</Text>
        </View>
      </View>

      {/* Recent Activity Section */}
      {showRecentActivity && (
        <View style={styles.activitySection}>
          <Text style={styles.activitySectionTitle}>Recent Activity</Text>
          {recentActivities.length > 0 ? (
            <View style={styles.activityList}>
              {recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons
                name="flash-outline"
                size={32}
                color={COLORS.textTertiary}
              />
              <Text style={styles.emptyActivityText}>
                Complete activities to earn points!
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// Compact version for use in Me tab (without recent activity by default)
export function PointsCard({
  points,
  isLoading,
}: {
  points?: PointsResponse;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <View style={[styles.mainCard, styles.skeleton]} />;
  }

  return (
    <View style={styles.mainCard}>
      <View style={styles.mainPointsSection}>
        <AnimatedCounter
          value={points?.points.total ?? 0}
          style={styles.totalPoints}
        />
        <Text style={styles.totalPointsLabel}>Total Points</Text>
      </View>
      <View style={styles.weekPointsSection}>
        <Text style={styles.weekPointsValue}>
          +{points?.points.this_week ?? 0}
        </Text>
        <Text style={styles.weekPointsLabel}>This Week</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // Main Points Card
  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 80,
  },
  mainPointsSection: {
    alignItems: "flex-start",
  },
  totalPoints: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.primary,
  },
  totalPointsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  weekPointsSection: {
    alignItems: "flex-end",
    backgroundColor: COLORS.success + "15",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  weekPointsValue: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.success,
  },
  weekPointsLabel: {
    fontSize: 12,
    color: COLORS.success,
  },

  // Activity Section
  activitySection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activitySectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  activityList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    marginRight: 8,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  activityPoints: {
    backgroundColor: COLORS.success + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activityPointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.success,
  },
  emptyActivity: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyActivityText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 8,
    textAlign: "center",
  },

  // Skeleton
  skeleton: {
    backgroundColor: COLORS.surface,
    opacity: 0.6,
    minHeight: 80,
  },
  activityHeader: {
    height: 20,
    width: 120,
    borderRadius: 4,
    marginBottom: 12,
  },
  activityItemSkeleton: {
    height: 56,
    borderRadius: 8,
    marginBottom: 8,
  },
});
