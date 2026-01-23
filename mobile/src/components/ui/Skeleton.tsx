import { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
  Dimensions,
  DimensionValue,
} from "react-native";
import { COLORS } from "@/theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Animation constants
const SHIMMER_DURATION = 1500;

interface SkeletonProps {
  /**
   * Width of the skeleton. Can be a number (pixels) or string (percentage)
   */
  width?: DimensionValue;
  /**
   * Height of the skeleton. Can be a number (pixels) or string (percentage)
   */
  height?: DimensionValue;
  /**
   * Border radius of the skeleton
   */
  borderRadius?: number;
  /**
   * Whether to show shimmer animation (default: true)
   */
  animated?: boolean;
  /**
   * Additional styles to apply
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Skeleton component with animated shimmer effect.
 * Used as a placeholder while content is loading.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 4,
  animated = true,
  style,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: SHIMMER_DURATION,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [animated, shimmerAnim]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
    >
      {animated && (
        <Animated.View
          style={[
            styles.shimmer,
            { transform: [{ translateX: shimmerTranslateX }] },
          ]}
        />
      )}
    </View>
  );
}

/**
 * Circular skeleton for avatars
 */
export function SkeletonCircle({
  size = 48,
  animated = true,
  style,
}: {
  size?: number;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      animated={animated}
      style={style}
    />
  );
}

/**
 * Text-like skeleton with random width variation
 */
export function SkeletonText({
  width = "100%",
  height = 16,
  animated = true,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={4}
      animated={animated}
      style={style}
    />
  );
}

/**
 * Paragraph skeleton with multiple lines
 */
export function SkeletonParagraph({
  lines = 3,
  lineHeight = 16,
  spacing = 8,
  animated = true,
  lastLineWidth = "60%",
  style,
}: {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  animated?: boolean;
  lastLineWidth?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.paragraph, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : "100%"}
          height={lineHeight}
          animated={animated}
          style={index < lines - 1 ? { marginBottom: spacing } : undefined}
        />
      ))}
    </View>
  );
}

/**
 * Card-like skeleton container
 */
export function SkeletonCard({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/**
 * Row skeleton with checkbox and text (for list items)
 */
export function SkeletonListItem({
  hasCheckbox = true,
  animated = true,
  style,
}: {
  hasCheckbox?: boolean;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.listItem, style]}>
      {hasCheckbox && <SkeletonCircle size={24} animated={animated} />}
      <Skeleton
        width="100%"
        height={18}
        animated={animated}
        style={styles.listItemText}
      />
    </View>
  );
}

/**
 * Section header skeleton
 */
export function SkeletonSectionHeader({
  animated = true,
  hasSubtitle = false,
  style,
}: {
  animated?: boolean;
  hasSubtitle?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionTitleRow}>
        <Skeleton width={120} height={18} animated={animated} />
        {hasSubtitle && (
          <Skeleton width={60} height={14} animated={animated} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    width: 100,
    transform: [{ skewX: "-20deg" }],
  },
  paragraph: {
    width: "100%",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  listItemText: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
});
