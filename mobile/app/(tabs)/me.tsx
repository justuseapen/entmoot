import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";

import { COLORS } from "@/theme/colors";
import { useAuthStore } from "@/stores";
import { api } from "@/lib/api";

// Types for API responses
interface Streak {
  id: number;
  streak_type: "daily_planning" | "evening_reflection" | "weekly_review";
  current_count: number;
  longest_count: number;
  last_activity_date: string | null;
  at_risk: boolean;
  next_milestone: number;
}

interface StreaksResponse {
  streaks: Streak[];
}

interface PointsResponse {
  points: {
    total: number;
    this_week: number;
    breakdown: Record<string, number>;
  };
  recent_activity: Array<{
    id: number;
    activity_type: string;
    activity_label: string;
    points: number;
    created_at: string;
    metadata: Record<string, unknown>;
  }>;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: string;
  earned: boolean;
  earned_at: string | null;
}

interface BadgesResponse {
  badges: Badge[];
  stats: {
    total_badges: number;
    earned_badges: number;
    completion_percentage: number;
  };
}

// Custom hooks for data fetching
function useStreaks() {
  return useQuery({
    queryKey: ["streaks"],
    queryFn: async () => {
      const response = await api.get<StreaksResponse>("/users/me/streaks");
      return response.streaks;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function usePoints() {
  return useQuery({
    queryKey: ["points"],
    queryFn: async () => {
      const response = await api.get<PointsResponse>("/users/me/points");
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function useBadges() {
  return useQuery({
    queryKey: ["badges", "me"],
    queryFn: async () => {
      const response = await api.get<BadgesResponse>("/users/me/badges");
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Streak type labels and icons
const STREAK_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  daily_planning: { label: "Daily Planning", icon: "sunny-outline" },
  evening_reflection: { label: "Reflection", icon: "moon-outline" },
  weekly_review: { label: "Weekly Review", icon: "calendar-outline" },
};

// Quick link items
const QUICK_LINKS = [
  {
    id: "settings",
    label: "Settings",
    icon: "settings-outline" as keyof typeof Ionicons.glyphMap,
    route: "/settings" as const,
  },
  {
    id: "habits",
    label: "Manage Habits",
    icon: "checkmark-circle-outline" as keyof typeof Ionicons.glyphMap,
    route: "/settings/habits" as const,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "notifications-outline" as keyof typeof Ionicons.glyphMap,
    route: "/settings/notifications" as const,
  },
  {
    id: "family",
    label: "Family",
    icon: "people-outline" as keyof typeof Ionicons.glyphMap,
    route: "/settings/family" as const,
  },
];

// Components
function ProfileHeader({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email: string;
  avatarUrl: string | null | undefined;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.profileHeader}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
      )}
      <View style={styles.profileInfo}>
        <Text style={styles.userName}>{name}</Text>
        <Text style={styles.userEmail}>{email}</Text>
      </View>
    </View>
  );
}

function StreakCard({ streak }: { streak: Streak }) {
  const config = STREAK_CONFIG[streak.streak_type];
  if (!config) return null;

  const isMilestone = [7, 14, 30, 60, 90, 180, 365].includes(
    streak.current_count
  );

  return (
    <View
      style={[
        styles.streakCard,
        streak.at_risk && styles.streakCardAtRisk,
        isMilestone && styles.streakCardMilestone,
      ]}
    >
      <Ionicons
        name={config.icon}
        size={24}
        color={streak.at_risk ? COLORS.warning : COLORS.primary}
      />
      <View style={styles.streakContent}>
        <Text style={styles.streakLabel}>{config.label}</Text>
        <View style={styles.streakCountRow}>
          <Text style={styles.streakCount}>{streak.current_count}</Text>
          <Text style={styles.fireEmoji}>🔥</Text>
        </View>
        <Text style={styles.streakBest}>Best: {streak.longest_count} days</Text>
      </View>
      {streak.at_risk && streak.current_count > 0 && (
        <View style={styles.atRiskBadge}>
          <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
        </View>
      )}
    </View>
  );
}

function StreaksSection({
  streaks,
  isLoading,
}: {
  streaks: Streak[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streaks</Text>
        <View style={styles.streaksRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.streakCard, styles.skeleton]} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Streaks</Text>
      <View style={styles.streaksRow}>
        {streaks?.map((streak) => (
          <StreakCard key={streak.id} streak={streak} />
        ))}
      </View>
    </View>
  );
}

function PointsSection({
  points,
  isLoading,
}: {
  points: PointsResponse | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Points</Text>
        <View style={[styles.pointsCard, styles.skeleton]} />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Points</Text>
      <View style={styles.pointsCard}>
        <View style={styles.pointsMain}>
          <Text style={styles.pointsTotal}>{points?.points.total ?? 0}</Text>
          <Text style={styles.pointsLabel}>Total Points</Text>
        </View>
        <View style={styles.pointsWeek}>
          <Text style={styles.pointsWeekValue}>
            +{points?.points.this_week ?? 0}
          </Text>
          <Text style={styles.pointsWeekLabel}>This Week</Text>
        </View>
      </View>
    </View>
  );
}

function BadgeItem({ badge }: { badge: Badge }) {
  return (
    <View style={styles.badgeItem}>
      <View style={styles.badgeIcon}>
        <Text style={styles.badgeEmoji}>{badge.icon}</Text>
      </View>
      <Text style={styles.badgeName} numberOfLines={1}>
        {badge.name.replace(/_/g, " ")}
      </Text>
    </View>
  );
}

function BadgesSection({
  badges,
  isLoading,
}: {
  badges: BadgesResponse | undefined;
  isLoading: boolean;
}) {
  const earnedBadges =
    badges?.badges.filter((b) => b.earned).slice(0, 3) ?? [];

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Badges</Text>
        <View style={styles.badgesRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.badgeItem, styles.skeleton]} />
          ))}
        </View>
      </View>
    );
  }

  if (earnedBadges.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Badges</Text>
        <View style={styles.emptyBadges}>
          <Ionicons name="ribbon-outline" size={32} color={COLORS.textTertiary} />
          <Text style={styles.emptyBadgesText}>
            Complete activities to earn badges!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Badges</Text>
        <Text style={styles.badgeStats}>
          {badges?.stats.earned_badges ?? 0}/{badges?.stats.total_badges ?? 0}
        </Text>
      </View>
      <View style={styles.badgesRow}>
        {earnedBadges.map((badge) => (
          <BadgeItem key={badge.id} badge={badge} />
        ))}
      </View>
    </View>
  );
}

function QuickLinksSection() {
  const router = useRouter();

  const handlePress = useCallback(
    (route: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(route as never);
    },
    [router]
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Links</Text>
      <View style={styles.quickLinksContainer}>
        {QUICK_LINKS.map((link) => (
          <TouchableOpacity
            key={link.id}
            style={styles.quickLinkItem}
            onPress={() => handlePress(link.route)}
            activeOpacity={0.7}
          >
            <View style={styles.quickLinkIcon}>
              <Ionicons name={link.icon} size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.quickLinkLabel}>{link.label}</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function MeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: streaks,
    isLoading: streaksLoading,
    refetch: refetchStreaks,
  } = useStreaks();
  const {
    data: points,
    isLoading: pointsLoading,
    refetch: refetchPoints,
  } = usePoints();
  const {
    data: badges,
    isLoading: badgesLoading,
    refetch: refetchBadges,
  } = useBadges();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchStreaks(), refetchPoints(), refetchBadges()]);
    setIsRefreshing(false);
  }, [refetchStreaks, refetchPoints, refetchBadges]);

  const handleLogout = useCallback(async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }, [logout, router]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Profile Header */}
        <ProfileHeader
          name={user?.name ?? "User"}
          email={user?.email ?? ""}
          avatarUrl={user?.avatar_url}
        />

        {/* Streaks Section */}
        <StreaksSection streaks={streaks} isLoading={streaksLoading} />

        {/* Points Section */}
        <PointsSection points={points} isLoading={pointsLoading} />

        {/* Badges Section */}
        <BadgesSection badges={badges} isLoading={badgesLoading} />

        {/* Quick Links Section */}
        <QuickLinksSection />

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Profile Header
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
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
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 100,
  },
  streakCardAtRisk: {
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  streakCardMilestone: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "08",
  },
  streakContent: {
    alignItems: "center",
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  streakCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },
  fireEmoji: {
    fontSize: 18,
  },
  streakBest: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  atRiskBadge: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  // Points
  pointsCard: {
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
  pointsMain: {
    alignItems: "flex-start",
  },
  pointsTotal: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.primary,
  },
  pointsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  pointsWeek: {
    alignItems: "flex-end",
    backgroundColor: COLORS.success + "15",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pointsWeekValue: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.success,
  },
  pointsWeekLabel: {
    fontSize: 12,
    color: COLORS.success,
  },

  // Badges
  badgeStats: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 12,
  },
  badgeItem: {
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
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
    textTransform: "capitalize",
  },
  emptyBadges: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBadgesText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 8,
    textAlign: "center",
  },

  // Quick Links
  quickLinksContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quickLinkLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.error,
  },

  // Skeleton
  skeleton: {
    backgroundColor: COLORS.surface,
    opacity: 0.6,
  },
});
