import { View, StyleSheet } from "react-native";
import {
  Skeleton,
  SkeletonCircle,
  SkeletonCard,
} from "@/components/ui/Skeleton";
import { COLORS } from "@/theme/colors";

/**
 * Profile header skeleton
 */
function ProfileHeaderSkeleton() {
  return (
    <View style={styles.profileHeader}>
      <SkeletonCircle size={72} />
      <View style={styles.profileInfo}>
        <Skeleton width={160} height={28} style={styles.userName} />
        <Skeleton width={180} height={16} />
      </View>
    </View>
  );
}

/**
 * Streaks section skeleton
 */
function StreaksSectionSkeleton() {
  return (
    <View style={styles.section}>
      <Skeleton width={70} height={20} style={styles.sectionTitle} />
      <View style={styles.streaksRow}>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} style={styles.streakCard}>
            <SkeletonCircle size={24} style={styles.streakIcon} />
            <Skeleton width={40} height={12} style={styles.streakLabel} />
            <Skeleton width={30} height={28} style={styles.streakCount} />
            <Skeleton width={60} height={10} />
          </SkeletonCard>
        ))}
      </View>
    </View>
  );
}

/**
 * Points section skeleton
 */
function PointsSectionSkeleton() {
  return (
    <View style={styles.section}>
      <Skeleton width={60} height={20} style={styles.sectionTitle} />
      <SkeletonCard style={styles.pointsCard}>
        <View style={styles.mainPointsSection}>
          <Skeleton width={100} height={40} style={styles.totalPoints} />
          <Skeleton width={80} height={14} />
        </View>
        <View style={styles.weekPointsSection}>
          <Skeleton width={50} height={24} style={styles.weekPoints} />
          <Skeleton width={60} height={12} />
        </View>
      </SkeletonCard>
    </View>
  );
}

/**
 * Badges section skeleton
 */
function BadgesSectionSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.badgesSectionHeader}>
        <Skeleton width={110} height={20} />
        <View style={styles.badgesHeaderRight}>
          <Skeleton width={30} height={14} />
          <Skeleton width={55} height={14} />
        </View>
      </View>
      <View style={styles.badgesRow}>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} style={styles.badgeItem}>
            <SkeletonCircle size={48} style={styles.badgeIcon} />
            <Skeleton width={50} height={12} />
          </SkeletonCard>
        ))}
      </View>
    </View>
  );
}

/**
 * Quick links section skeleton
 */
function QuickLinksSectionSkeleton() {
  return (
    <View style={styles.section}>
      <Skeleton width={90} height={20} style={styles.sectionTitle} />
      <SkeletonCard style={styles.quickLinksCard}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.quickLinkItem}>
            <Skeleton
              width={36}
              height={36}
              borderRadius={8}
              style={styles.quickLinkIcon}
            />
            <Skeleton width={120} height={18} style={styles.quickLinkText} />
            <Skeleton width={20} height={20} />
          </View>
        ))}
      </SkeletonCard>
    </View>
  );
}

/**
 * Full Me tab skeleton component
 * Matches the layout of the Me screen while content is loading
 */
export function MeTabSkeleton() {
  return (
    <View style={styles.container}>
      <ProfileHeaderSkeleton />
      <StreaksSectionSkeleton />
      <PointsSectionSkeleton />
      <BadgesSectionSkeleton />
      <QuickLinksSectionSkeleton />
    </View>
  );
}

// Export individual section skeletons for granular use
export {
  ProfileHeaderSkeleton,
  StreaksSectionSkeleton,
  PointsSectionSkeleton,
  BadgesSectionSkeleton,
  QuickLinksSectionSkeleton,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Profile Header
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 24,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    marginBottom: 8,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },

  // Streaks
  streaksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  streakCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    minHeight: 100,
  },
  streakIcon: {
    marginBottom: 8,
  },
  streakLabel: {
    marginBottom: 4,
  },
  streakCount: {
    marginBottom: 4,
  },

  // Points
  pointsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    minHeight: 80,
  },
  mainPointsSection: {
    alignItems: "flex-start",
  },
  totalPoints: {
    marginBottom: 4,
  },
  weekPointsSection: {
    alignItems: "flex-end",
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 8,
  },
  weekPoints: {
    marginBottom: 4,
  },

  // Badges
  badgesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badgesHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 12,
  },
  badgeItem: {
    alignItems: "center",
    padding: 12,
    width: 80,
  },
  badgeIcon: {
    marginBottom: 8,
  },

  // Quick Links
  quickLinksCard: {
    padding: 0,
    overflow: "hidden",
  },
  quickLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  quickLinkIcon: {
    marginRight: 12,
  },
  quickLinkText: {
    flex: 1,
  },
});
