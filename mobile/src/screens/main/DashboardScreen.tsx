import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import type { MainTabScreenProps } from "../../navigation/types";
import { useAuthStore } from "../../stores";
import type { Family, Streak, Notification } from "@shared/types";
import { getFamilies } from "../../lib/families";
import { getStreaks, getStreakLabel, getStreakEmoji } from "../../lib/streaks";
import {
  getNotifications,
  formatNotificationTime,
} from "../../lib/notifications";
import { getTodaysPlan, getTimeBasedGreeting } from "../../lib/dailyPlans";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  creamWhite: "#FFF8E7",
  earthBrown: "#795548",
  darkForest: "#1B3A1A",
  warmGold: "#FFD54F",
  skyBlue: "#64B5F6",
  sunsetOrange: "#FF7043",
};

type Props = MainTabScreenProps<"Dashboard">;

interface DashboardStats {
  tasksCompletedToday: number;
  totalTasksToday: number;
}

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamilyId, setCurrentFamilyId] = useState<number | null>(null);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    tasksCompletedToday: 0,
    totalTasksToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFamilySwitcher, setShowFamilySwitcher] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Load families first
      const familiesRes = await getFamilies();
      setFamilies(familiesRes.families);

      // Set default family if not set
      const familyId = currentFamilyId || familiesRes.families[0]?.id;
      if (familyId && !currentFamilyId) {
        setCurrentFamilyId(familyId);
      }

      // Load data in parallel
      const [streaksRes, notificationsRes] = await Promise.all([
        getStreaks(),
        getNotifications(5),
      ]);

      setStreaks(streaksRes.streaks);
      setNotifications(notificationsRes.notifications);

      // Load daily plan stats if we have a family
      if (familyId) {
        try {
          const dailyPlan = await getTodaysPlan(familyId);
          setStats({
            tasksCompletedToday: dailyPlan.completion_stats.completed,
            totalTasksToday: dailyPlan.completion_stats.total,
          });
        } catch {
          // No daily plan yet, that&apos;s okay
          setStats({ tasksCompletedToday: 0, totalTasksToday: 0 });
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  }, [currentFamilyId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    load();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleFamilySelect = (familyId: number) => {
    setCurrentFamilyId(familyId);
    setShowFamilySwitcher(false);
  };

  const currentFamily = families.find((f) => f.id === currentFamilyId);
  const totalStreakCount = streaks.reduce(
    (sum, streak) => sum + streak.current_count,
    0
  );

  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.forestGreen} />
        <Text style={styles.loadingText}>Loading your adventure...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.forestGreen}
          colors={[COLORS.forestGreen]}
        />
      }
    >
      {/* Header with greeting and family switcher */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getTimeBasedGreeting()},{" "}
            {user?.name?.split(" ")[0] || "Adventurer"}!
          </Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        {families.length > 1 && (
          <TouchableOpacity
            style={styles.familySwitcherButton}
            onPress={() => setShowFamilySwitcher(true)}
          >
            <Text style={styles.familySwitcherText}>
              {currentFamily?.name || "Select Family"}
            </Text>
            <Text style={styles.familySwitcherIcon}>▼</Text>
          </TouchableOpacity>
        )}
        {families.length === 1 && currentFamily && (
          <View style={styles.familyBadge}>
            <Text style={styles.familyBadgeText}>{currentFamily.name}</Text>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>✅</Text>
          <Text style={styles.statNumber}>
            {stats.tasksCompletedToday}/{stats.totalTasksToday}
          </Text>
          <Text style={styles.statLabel}>Tasks Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statNumber}>{totalStreakCount}</Text>
          <Text style={styles.statLabel}>Streak Days</Text>
        </View>
      </View>

      {/* Streaks Section */}
      {streaks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Streaks</Text>
          <View style={styles.streaksContainer}>
            {streaks.map((streak) => (
              <View key={streak.id} style={styles.streakItem}>
                <Text style={styles.streakEmoji}>
                  {getStreakEmoji(streak.streak_type)}
                </Text>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakLabel}>
                    {getStreakLabel(streak.streak_type)}
                  </Text>
                  <Text style={styles.streakCount}>
                    {streak.current_count}{" "}
                    {streak.streak_type === "weekly_review"
                      ? streak.current_count === 1
                        ? "week"
                        : "weeks"
                      : streak.current_count === 1
                        ? "day"
                        : "days"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.warmGold }]}
            onPress={() => navigation.navigate("DailyPlanner")}
          >
            <Text style={styles.actionEmoji}>☀️</Text>
            <Text style={styles.actionText}>Morning Planning</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.skyBlue }]}
            onPress={() => navigation.navigate("DailyPlanner")}
          >
            <Text style={styles.actionEmoji}>🌙</Text>
            <Text style={styles.actionText}>Evening Reflection</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: COLORS.sunsetOrange },
            ]}
            onPress={() => navigation.navigate("Goals")}
          >
            <Text style={styles.actionEmoji}>📊</Text>
            <Text style={styles.actionText}>Weekly Review</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Notifications" as never)}
          >
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>
        {notifications.length > 0 ? (
          <View style={styles.notificationsContainer}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.notificationUnread,
                ]}
              >
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  {notification.body && (
                    <Text style={styles.notificationBody} numberOfLines={2}>
                      {notification.body}
                    </Text>
                  )}
                  <Text style={styles.notificationTime}>
                    {formatNotificationTime(notification.created_at)}
                  </Text>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyNotifications}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}
      </View>

      {/* Family Switcher Modal */}
      <Modal
        visible={showFamilySwitcher}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFamilySwitcher(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch Family</Text>
            <FlatList
              data={families}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.familyItem,
                    item.id === currentFamilyId && styles.familyItemSelected,
                  ]}
                  onPress={() => handleFamilySelect(item.id)}
                >
                  <Text
                    style={[
                      styles.familyItemText,
                      item.id === currentFamilyId &&
                        styles.familyItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.id === currentFamilyId && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFamilySwitcher(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.creamWhite,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.creamWhite,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.earthBrown,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.darkForest,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: COLORS.earthBrown,
  },
  familySwitcherButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.forestGreen}30`,
  },
  familySwitcherText: {
    fontSize: 14,
    color: COLORS.forestGreen,
    fontWeight: "500",
    marginRight: 4,
  },
  familySwitcherIcon: {
    fontSize: 10,
    color: COLORS.forestGreen,
  },
  familyBadge: {
    backgroundColor: `${COLORS.forestGreen}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  familyBadgeText: {
    fontSize: 14,
    color: COLORS.forestGreen,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.darkForest,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.earthBrown,
  },
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
    color: COLORS.darkForest,
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 14,
    color: COLORS.forestGreen,
    fontWeight: "500",
  },
  streaksContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  streakItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  streakEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.darkForest,
  },
  streakCount: {
    fontSize: 12,
    color: COLORS.earthBrown,
    marginTop: 2,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
  actionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkForest,
  },
  notificationsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.earthBrown}10`,
  },
  notificationUnread: {
    backgroundColor: `${COLORS.forestGreen}05`,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkForest,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 13,
    color: COLORS.earthBrown,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: `${COLORS.earthBrown}80`,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.forestGreen,
    marginLeft: 8,
  },
  emptyNotifications: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.earthBrown,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.creamWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "50%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.darkForest,
    marginBottom: 16,
    textAlign: "center",
  },
  familyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  familyItemSelected: {
    backgroundColor: `${COLORS.forestGreen}15`,
    borderWidth: 1,
    borderColor: COLORS.forestGreen,
  },
  familyItemText: {
    fontSize: 16,
    color: COLORS.darkForest,
  },
  familyItemTextSelected: {
    fontWeight: "600",
    color: COLORS.forestGreen,
  },
  checkmark: {
    fontSize: 18,
    color: COLORS.forestGreen,
    fontWeight: "bold",
  },
  modalCloseButton: {
    marginTop: 8,
    padding: 16,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 16,
    color: COLORS.earthBrown,
    fontWeight: "500",
  },
});
