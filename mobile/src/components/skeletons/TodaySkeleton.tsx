import { View, StyleSheet } from "react-native";
import {
  Skeleton,
  SkeletonCircle,
  SkeletonListItem,
  SkeletonCard,
} from "@/components/ui/Skeleton";
import { COLORS } from "@/theme/colors";

/**
 * Header skeleton matching the Today screen header layout
 */
function TodayHeaderSkeleton() {
  return (
    <View style={styles.header}>
      {/* Date skeleton */}
      <Skeleton width={140} height={16} style={styles.dateRow} />
      {/* Greeting skeleton */}
      <Skeleton width={220} height={32} style={styles.greetingRow} />
      {/* Completion badge skeleton */}
      <Skeleton width={110} height={28} borderRadius={16} />
    </View>
  );
}

/**
 * Intention section skeleton
 */
function IntentionSectionSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Skeleton width={130} height={18} />
      </View>
      <Skeleton width="80%" height={24} />
    </View>
  );
}

/**
 * Schedule (Calendar) section skeleton
 */
function ScheduleSectionSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.scheduleTitleRow}>
          <Skeleton width={18} height={18} borderRadius={4} />
          <Skeleton width={80} height={18} style={styles.scheduleTitleText} />
        </View>
        <Skeleton width={50} height={14} />
      </View>
      <View style={styles.eventList}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.eventItem}>
            <SkeletonCircle size={10} style={styles.eventDot} />
            <View style={styles.eventContent}>
              <Skeleton width={60} height={12} style={styles.eventTime} />
              <Skeleton width="70%" height={16} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Top Priorities section skeleton
 */
function PrioritiesSectionSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Skeleton width={110} height={18} />
        <Skeleton width={80} height={14} />
      </View>
      <View style={styles.listItems}>
        {[1, 2, 3].map((i) => (
          <SkeletonListItem key={i} hasCheckbox />
        ))}
      </View>
      {/* Add priority button skeleton */}
      <View style={styles.addButtonSkeleton}>
        <Skeleton width={100} height={16} />
      </View>
    </View>
  );
}

/**
 * Habits (Non-Negotiables) section skeleton
 */
function HabitsSectionSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Skeleton width={130} height={18} />
        <Skeleton width={90} height={14} />
      </View>
      <View style={styles.listItems}>
        {[1, 2, 3].map((i) => (
          <SkeletonListItem key={i} hasCheckbox />
        ))}
      </View>
    </View>
  );
}

/**
 * Tasks section skeleton
 */
function TasksSectionSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Skeleton width={50} height={18} />
        <Skeleton width={90} height={14} />
      </View>
      <View style={styles.listItems}>
        {[1, 2, 3].map((i) => (
          <SkeletonListItem key={i} hasCheckbox />
        ))}
      </View>
      {/* Add task input skeleton */}
      <View style={styles.addTaskInputSkeleton}>
        <Skeleton width="100%" height={40} borderRadius={8} />
      </View>
    </View>
  );
}

/**
 * Full Today screen skeleton component
 * Matches the layout of the Today screen while content is loading
 */
export function TodaySkeleton() {
  return (
    <View style={styles.container}>
      <TodayHeaderSkeleton />
      <IntentionSectionSkeleton />
      <ScheduleSectionSkeleton />
      <PrioritiesSectionSkeleton />
      <HabitsSectionSkeleton />
      <TasksSectionSkeleton />
    </View>
  );
}

// Export individual section skeletons for granular use
export {
  TodayHeaderSkeleton,
  IntentionSectionSkeleton,
  ScheduleSectionSkeleton,
  PrioritiesSectionSkeleton,
  HabitsSectionSkeleton,
  TasksSectionSkeleton,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  dateRow: {
    marginBottom: 8,
  },
  greetingRow: {
    marginBottom: 16,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  scheduleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scheduleTitleText: {
    marginLeft: 8,
  },
  eventList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  eventDot: {
    marginRight: 12,
    marginTop: 4,
  },
  eventContent: {
    flex: 1,
    gap: 6,
  },
  eventTime: {
    marginBottom: 4,
  },
  listItems: {
    gap: 4,
  },
  addButtonSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderStyle: "dashed",
  },
  addTaskInputSkeleton: {
    marginTop: 12,
  },
});
