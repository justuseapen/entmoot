import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { COLORS } from "@/theme/colors";
import { Skeleton, SkeletonCard, SkeletonCircle } from "@/components/ui/Skeleton";
import {
  type Badge,
  type BadgeStats,
  getBadgeCategoryConfig,
  isNewlyEarned,
  formatEarnedDate,
} from "@/hooks/useBadges";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BADGE_SIZE = (SCREEN_WIDTH - 32 - 24) / 3; // 3 columns with gaps

// Props interfaces
interface BadgeGridProps {
  badges: Badge[];
  stats?: BadgeStats;
  isLoading?: boolean;
  showLocked?: boolean;
  onBadgePress?: (badge: Badge) => void;
}

interface BadgeItemProps {
  badge: Badge;
  onPress: (badge: Badge) => void;
}

interface BadgeDetailModalProps {
  badge: Badge | null;
  visible: boolean;
  onClose: () => void;
}

interface LockedBadgeItemProps {
  badge: Badge;
  onPress: (badge: Badge) => void;
}

// Badge item component for earned badges
function BadgeItem({ badge, onPress }: BadgeItemProps) {
  const shineAnim = useRef(new Animated.Value(-1)).current;
  const isNew = isNewlyEarned(badge);

  // Shine animation for newly earned badges
  useEffect(() => {
    if (isNew) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.delay(3000), // Wait 3 seconds before repeating
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isNew, shineAnim]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(badge);
  }, [badge, onPress]);

  // Shine overlay transform
  const shineTranslateX = shineAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-BADGE_SIZE * 2, BADGE_SIZE * 2],
  });

  return (
    <TouchableOpacity
      style={styles.badgeItem}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.badgeIconContainer}>
        <Text style={styles.badgeEmoji}>{badge.icon}</Text>
        {isNew && (
          <Animated.View
            style={[
              styles.shineOverlay,
              { transform: [{ translateX: shineTranslateX }] },
            ]}
          />
        )}
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>
      <Text style={styles.badgeName} numberOfLines={2}>
        {badge.name.replace(/_/g, " ")}
      </Text>
    </TouchableOpacity>
  );
}

// Locked badge item component
function LockedBadgeItem({ badge, onPress }: LockedBadgeItemProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(badge);
  }, [badge, onPress]);

  return (
    <TouchableOpacity
      style={styles.badgeItem}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.badgeIconContainer, styles.lockedBadgeIcon]}>
        <Text style={[styles.badgeEmoji, styles.lockedEmoji]}>{badge.icon}</Text>
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={20} color={COLORS.textTertiary} />
        </View>
      </View>
      <Text style={[styles.badgeName, styles.lockedBadgeName]} numberOfLines={2}>
        {badge.name.replace(/_/g, " ")}
      </Text>
    </TouchableOpacity>
  );
}

// Badge detail modal
function BadgeDetailModal({ badge, visible, onClose }: BadgeDetailModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible, badge, scaleAnim, opacityAnim]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [opacityAnim, onClose]);

  if (!badge) return null;

  const categoryConfig = getBadgeCategoryConfig(badge.category);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Badge icon */}
            <View
              style={[
                styles.modalBadgeIcon,
                !badge.earned && styles.modalLockedBadgeIcon,
              ]}
            >
              <Text
                style={[
                  styles.modalBadgeEmoji,
                  !badge.earned && styles.lockedEmoji,
                ]}
              >
                {badge.icon}
              </Text>
              {!badge.earned && (
                <View style={styles.modalLockOverlay}>
                  <Ionicons name="lock-closed" size={32} color={COLORS.textTertiary} />
                </View>
              )}
            </View>

            {/* Badge name */}
            <Text style={styles.modalBadgeName}>
              {badge.name.replace(/_/g, " ")}
            </Text>

            {/* Category badge */}
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: categoryConfig.color + "20" },
              ]}
            >
              <Ionicons
                name={categoryConfig.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={categoryConfig.color}
              />
              <Text style={[styles.categoryText, { color: categoryConfig.color }]}>
                {categoryConfig.label}
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.modalDescription}>{badge.description}</Text>

            {/* Criteria */}
            <View style={styles.criteriaSection}>
              <Text style={styles.criteriaLabel}>How to earn:</Text>
              <Text style={styles.criteriaText}>{badge.criteria}</Text>
            </View>

            {/* Earned status */}
            {badge.earned && badge.earned_at ? (
              <View style={styles.earnedSection}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.earnedText}>
                  Earned on {formatEarnedDate(badge.earned_at)}
                </Text>
              </View>
            ) : (
              <View style={styles.lockedSection}>
                <Ionicons name="lock-closed" size={20} color={COLORS.textTertiary} />
                <Text style={styles.lockedText}>Not yet earned</Text>
              </View>
            )}

            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// Loading skeleton with animated shimmer
function BadgeGridSkeleton() {
  return (
    <View style={styles.gridContainer}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonCard key={i} style={styles.badgeItemSkeleton}>
          <SkeletonCircle size={56} style={styles.badgeSkeletonIcon} />
          <Skeleton width={60} height={12} />
        </SkeletonCard>
      ))}
    </View>
  );
}

// Empty state
function EmptyBadgesState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="ribbon-outline" size={48} color={COLORS.textTertiary} />
      <Text style={styles.emptyStateTitle}>No badges yet</Text>
      <Text style={styles.emptyStateText}>
        Complete activities and maintain streaks to earn badges!
      </Text>
    </View>
  );
}

// Main BadgeGrid component
export function BadgeGrid({
  badges,
  stats,
  isLoading = false,
  showLocked = true,
  onBadgePress,
}: BadgeGridProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleBadgePress = useCallback(
    (badge: Badge) => {
      if (onBadgePress) {
        onBadgePress(badge);
      } else {
        setSelectedBadge(badge);
        setModalVisible(true);
      }
    },
    [onBadgePress]
  );

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => setSelectedBadge(null), 200);
  }, []);

  if (isLoading) {
    return <BadgeGridSkeleton />;
  }

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  if (badges.length === 0) {
    return <EmptyBadgesState />;
  }

  return (
    <View>
      {/* Stats header */}
      {stats && (
        <View style={styles.statsHeader}>
          <Text style={styles.statsText}>
            {stats.earned_badges} / {stats.total_badges} badges earned
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${stats.completion_percentage}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Earned badges section */}
      {earnedBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earned</Text>
          <View style={styles.gridContainer}>
            {earnedBadges.map((badge) => (
              <BadgeItem
                key={badge.id}
                badge={badge}
                onPress={handleBadgePress}
              />
            ))}
          </View>
        </View>
      )}

      {/* Locked badges section */}
      {showLocked && lockedBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locked</Text>
          <View style={styles.gridContainer}>
            {lockedBadges.map((badge) => (
              <LockedBadgeItem
                key={badge.id}
                badge={badge}
                onPress={handleBadgePress}
              />
            ))}
          </View>
        </View>
      )}

      {/* Detail modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        visible={modalVisible}
        onClose={handleCloseModal}
      />
    </View>
  );
}

// Compact BadgeRow for Me tab (shows last 3 earned)
interface BadgeRowProps {
  badges: Badge[];
  stats?: BadgeStats;
  isLoading?: boolean;
  onViewAll?: () => void;
}

export function BadgeRow({
  badges,
  stats,
  isLoading = false,
  onViewAll,
}: BadgeRowProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleBadgePress = useCallback((badge: Badge) => {
    setSelectedBadge(badge);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => setSelectedBadge(null), 200);
  }, []);

  const handleViewAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewAll?.();
  }, [onViewAll]);

  if (isLoading) {
    return (
      <View style={styles.rowContainer}>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} style={styles.rowBadgeItemSkeleton}>
            <SkeletonCircle size={48} style={styles.rowBadgeSkeletonIcon} />
            <Skeleton width={50} height={12} />
          </SkeletonCard>
        ))}
      </View>
    );
  }

  // Get most recently earned badges
  const earnedBadges = badges
    .filter((b) => b.earned)
    .sort((a, b) => {
      if (!a.earned_at) return 1;
      if (!b.earned_at) return -1;
      return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime();
    })
    .slice(0, 3);

  if (earnedBadges.length === 0) {
    return (
      <View style={styles.emptyRow}>
        <Ionicons name="ribbon-outline" size={32} color={COLORS.textTertiary} />
        <Text style={styles.emptyRowText}>
          Complete activities to earn badges!
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.rowHeader}>
        {stats && (
          <Text style={styles.rowStats}>
            {stats.earned_badges}/{stats.total_badges}
          </Text>
        )}
        {onViewAll && (
          <TouchableOpacity onPress={handleViewAll} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.rowContainer}>
        {earnedBadges.map((badge) => (
          <TouchableOpacity
            key={badge.id}
            style={styles.rowBadgeItem}
            onPress={() => handleBadgePress(badge)}
            activeOpacity={0.7}
          >
            <View style={styles.rowBadgeIcon}>
              <Text style={styles.rowBadgeEmoji}>{badge.icon}</Text>
            </View>
            <Text style={styles.rowBadgeName} numberOfLines={1}>
              {badge.name.replace(/_/g, " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <BadgeDetailModal
        badge={selectedBadge}
        visible={modalVisible}
        onClose={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Grid styles
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeItem: {
    width: BADGE_SIZE,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
    textTransform: "capitalize",
    height: 32,
  },

  // Locked badge styles
  lockedBadgeIcon: {
    backgroundColor: COLORS.textTertiary + "15",
  },
  lockedEmoji: {
    opacity: 0.4,
  },
  lockedBadgeName: {
    color: COLORS.textTertiary,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  // Shine animation
  shineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.3)",
    width: 40,
    transform: [{ skewX: "-20deg" }],
  },

  // New badge indicator
  newBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.success,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
  },

  // Section styles
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 12,
  },

  // Stats header
  statsHeader: {
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  modalBadgeIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  modalLockedBadgeIcon: {
    backgroundColor: COLORS.textTertiary + "15",
  },
  modalBadgeEmoji: {
    fontSize: 48,
  },
  modalLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  modalBadgeName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  criteriaSection: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  criteriaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  criteriaText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  earnedSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  earnedText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: "500",
  },
  lockedSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  lockedText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontWeight: "500",
  },
  closeButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: "center",
    lineHeight: 20,
  },

  // Skeleton (legacy, kept for compatibility)
  skeleton: {
    backgroundColor: COLORS.surface,
    opacity: 0.6,
    height: 100,
  },
  // Animated skeleton styles
  badgeItemSkeleton: {
    width: BADGE_SIZE,
    alignItems: "center",
    padding: 12,
    height: 100,
  },
  badgeSkeletonIcon: {
    marginBottom: 8,
  },
  rowBadgeItemSkeleton: {
    alignItems: "center",
    padding: 12,
    width: 80,
  },
  rowBadgeSkeletonIcon: {
    marginBottom: 8,
  },

  // Row styles (for compact Me tab view)
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rowStats: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  rowBadgeItem: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    width: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  rowBadgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  rowBadgeEmoji: {
    fontSize: 24,
  },
  rowBadgeName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
    textTransform: "capitalize",
  },
  emptyRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyRowText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 8,
    textAlign: "center",
  },
});
