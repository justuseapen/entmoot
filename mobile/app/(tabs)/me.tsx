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

import { COLORS } from "@/theme/colors";
import { useAuthStore } from "@/stores";
import {
  useStreaks,
  usePoints,
  useUserBadges,
  type Streak,
  type PointsResponse,
  type UserBadgesResponse,
} from "@/hooks";
import { StreakCardsRow, PointsCard, BadgeRow } from "@/components";

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

function StreaksSection({
  streaks,
  isLoading,
}: {
  streaks: Streak[] | undefined;
  isLoading: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Streaks</Text>
      <StreakCardsRow streaks={streaks} isLoading={isLoading} />
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
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Points</Text>
      <PointsCard points={points} isLoading={isLoading} />
    </View>
  );
}

function BadgesSection({
  badges,
  isLoading,
}: {
  badges: UserBadgesResponse | undefined;
  isLoading: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Badges</Text>
      <BadgeRow
        badges={badges?.badges ?? []}
        stats={badges?.stats}
        isLoading={isLoading}
      />
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
  } = useUserBadges();

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
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
});
