import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import ConfettiCannon from "react-native-confetti-cannon";

import { COLORS } from "@/theme/colors";
import type { Badge } from "@/hooks/useBadges";
import { STREAK_MILESTONES } from "@/hooks/useStreaks";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Achievement types that can trigger celebration
export type AchievementType =
  | "badge_earned"
  | "streak_milestone"
  | "goal_completed";

// Achievement data structure
export interface Achievement {
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  points: number;
  badge?: Badge;
  streakType?: string;
  streakCount?: number;
  goalTitle?: string;
}

// Props for the modal component
interface AchievementModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onDismiss: () => void;
}

// Get celebration title based on achievement type
function getCelebrationTitle(achievement: Achievement): string {
  switch (achievement.type) {
    case "badge_earned":
      return "Badge Earned!";
    case "streak_milestone":
      return "Streak Milestone!";
    case "goal_completed":
      return "Goal Completed!";
    default:
      return "Achievement Unlocked!";
  }
}

// Get celebration color based on achievement type
function getCelebrationColor(achievement: Achievement): string {
  switch (achievement.type) {
    case "badge_earned":
      return "#EAB308"; // Gold
    case "streak_milestone":
      return "#F97316"; // Orange
    case "goal_completed":
      return COLORS.success;
    default:
      return COLORS.primary;
  }
}

export function AchievementModal({
  visible,
  achievement,
  onDismiss,
}: AchievementModalProps) {
  const confettiRef = useRef<ConfettiCannon | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const pointsOpacityAnim = useRef(new Animated.Value(0)).current;
  const pointsTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible && achievement) {
      // Heavy haptic feedback for celebration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      iconScaleAnim.setValue(0);
      pointsOpacityAnim.setValue(0);
      pointsTranslateY.setValue(20);

      // Start confetti
      setTimeout(() => {
        confettiRef.current?.start();
      }, 100);

      // Animate modal entrance
      Animated.sequence([
        // Fade in background
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Pop in modal with spring
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate icon with bounce after modal appears
      setTimeout(() => {
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }).start();
      }, 300);

      // Animate points appearing
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(pointsOpacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(pointsTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
      }, 500);
    }
  }, [
    visible,
    achievement,
    scaleAnim,
    opacityAnim,
    iconScaleAnim,
    pointsOpacityAnim,
    pointsTranslateY,
  ]);

  const handleDismiss = useCallback(() => {
    // Haptic feedback on dismiss
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Animate out
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [scaleAnim, opacityAnim, onDismiss]);

  if (!achievement) return null;

  const celebrationColor = getCelebrationColor(achievement);
  const celebrationTitle = getCelebrationTitle(achievement);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        {/* Confetti cannon */}
        <ConfettiCannon
          ref={confettiRef}
          count={150}
          origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
          fadeOut
          explosionSpeed={350}
          fallSpeed={2500}
          colors={[
            "#FFD700", // Gold
            "#FF6B6B", // Coral
            "#4ECDC4", // Teal
            "#45B7D1", // Sky blue
            "#96CEB4", // Sage
            "#FFEAA7", // Light gold
            "#DDA0DD", // Plum
            "#98D8C8", // Mint
          ]}
          autoStart={false}
        />

        <Pressable style={styles.overlayPressable} onPress={handleDismiss}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Celebration header */}
              <View
                style={[
                  styles.celebrationHeader,
                  { backgroundColor: celebrationColor + "15" },
                ]}
              >
                <Ionicons name="sparkles" size={24} color={celebrationColor} />
                <Text style={[styles.celebrationTitle, { color: celebrationColor }]}>
                  {celebrationTitle}
                </Text>
                <Ionicons name="sparkles" size={24} color={celebrationColor} />
              </View>

              {/* Achievement icon */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  { backgroundColor: celebrationColor + "20" },
                  { transform: [{ scale: iconScaleAnim }] },
                ]}
              >
                <Text style={styles.iconEmoji}>{achievement.icon}</Text>
              </Animated.View>

              {/* Achievement title */}
              <Text style={styles.achievementTitle}>{achievement.title}</Text>

              {/* Achievement description */}
              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>

              {/* Points earned */}
              {achievement.points > 0 && (
                <Animated.View
                  style={[
                    styles.pointsContainer,
                    {
                      opacity: pointsOpacityAnim,
                      transform: [{ translateY: pointsTranslateY }],
                    },
                  ]}
                >
                  <Ionicons name="star" size={20} color="#EAB308" />
                  <Text style={styles.pointsText}>
                    +{achievement.points} points!
                  </Text>
                </Animated.View>
              )}

              {/* Dismiss button */}
              <TouchableOpacity
                style={[
                  styles.dismissButton,
                  { backgroundColor: celebrationColor },
                ]}
                onPress={handleDismiss}
                activeOpacity={0.8}
              >
                <Text style={styles.dismissButtonText}>Awesome!</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

// Hook for managing achievement celebration state
type AchievementListener = (achievement: Achievement) => void;

const achievementListeners: Set<AchievementListener> = new Set();

/**
 * Trigger an achievement celebration
 */
export function triggerAchievementCelebration(achievement: Achievement) {
  achievementListeners.forEach((listener) => listener(achievement));
}

/**
 * Create a badge earned achievement
 */
export function createBadgeAchievement(badge: Badge): Achievement {
  return {
    type: "badge_earned",
    title: badge.name.replace(/_/g, " "),
    description: badge.description,
    icon: badge.icon,
    points: badge.points_awarded ?? 50,
    badge,
  };
}

/**
 * Create a streak milestone achievement
 */
export function createStreakMilestoneAchievement(
  streakType: string,
  currentCount: number
): Achievement {
  const milestone = STREAK_MILESTONES.find((m) => m === currentCount) ?? currentCount;
  const streakLabel = streakType.replace(/_/g, " ");

  return {
    type: "streak_milestone",
    title: `${milestone}-Day ${streakLabel} Streak!`,
    description: `You've maintained your ${streakLabel.toLowerCase()} streak for ${milestone} days straight!`,
    icon: "🔥",
    points: milestone * 5, // 5 points per day of milestone
    streakType,
    streakCount: currentCount,
  };
}

/**
 * Create a goal completed achievement
 */
export function createGoalCompletedAchievement(
  goalTitle: string,
  points: number = 100
): Achievement {
  return {
    type: "goal_completed",
    title: "Goal Achieved!",
    description: `Congratulations on completing "${goalTitle}"!`,
    icon: "🎯",
    points,
    goalTitle,
  };
}

/**
 * Hook to use achievement celebration in components
 */
export function useAchievementCelebration() {
  const [visible, setVisible] = useState(false);
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const queueRef = useRef<Achievement[]>([]);

  const showAchievement = useCallback((newAchievement: Achievement) => {
    if (visible) {
      // Queue the achievement if one is already showing
      queueRef.current.push(newAchievement);
    } else {
      setAchievement(newAchievement);
      setVisible(true);
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    setVisible(false);

    // Process queued achievements after a short delay
    setTimeout(() => {
      const nextAchievement = queueRef.current.shift();
      if (nextAchievement) {
        setAchievement(nextAchievement);
        setVisible(true);
      } else {
        setAchievement(null);
      }
    }, 300);
  }, []);

  // Subscribe to global achievement events
  useEffect(() => {
    achievementListeners.add(showAchievement);
    return () => {
      achievementListeners.delete(showAchievement);
    };
  }, [showAchievement]);

  // Check for streak milestone
  const checkStreakMilestone = useCallback(
    (streakType: string, currentCount: number, previousCount?: number) => {
      // Check if we just hit a milestone
      const hitMilestone = STREAK_MILESTONES.some(
        (milestone) =>
          currentCount >= milestone &&
          (previousCount === undefined || previousCount < milestone)
      );

      if (hitMilestone) {
        const milestone = [...STREAK_MILESTONES]
          .reverse()
          .find((m) => currentCount >= m);
        if (milestone) {
          showAchievement(createStreakMilestoneAchievement(streakType, milestone));
        }
      }
    },
    [showAchievement]
  );

  // Trigger badge earned celebration
  const celebrateBadgeEarned = useCallback(
    (badge: Badge) => {
      showAchievement(createBadgeAchievement(badge));
    },
    [showAchievement]
  );

  // Trigger goal completed celebration
  const celebrateGoalCompleted = useCallback(
    (goalTitle: string, points?: number) => {
      showAchievement(createGoalCompletedAchievement(goalTitle, points));
    },
    [showAchievement]
  );

  return {
    // State for rendering the modal
    visible,
    achievement,
    handleDismiss,
    // Methods to trigger celebrations
    showAchievement,
    celebrateBadgeEarned,
    celebrateGoalCompleted,
    checkStreakMilestone,
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayPressable: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  celebrationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  celebrationTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  iconEmoji: {
    fontSize: 60,
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  achievementDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7", // Amber 100
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 24,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B45309", // Amber 700
  },
  dismissButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  dismissButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textOnPrimary,
  },
});
