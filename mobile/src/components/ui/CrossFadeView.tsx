import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle, StyleProp } from "react-native";

interface CrossFadeViewProps {
  /**
   * Whether the content is loading (show skeleton)
   */
  isLoading: boolean;
  /**
   * The skeleton component to show while loading
   */
  skeleton: React.ReactNode;
  /**
   * The actual content to show when loaded
   */
  children: React.ReactNode;
  /**
   * Duration of the crossfade animation in milliseconds
   * @default 300
   */
  duration?: number;
  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * CrossFadeView provides a smooth fade transition between
 * skeleton loading states and actual content.
 */
export function CrossFadeView({
  isLoading,
  skeleton,
  children,
  duration = 300,
  style,
}: CrossFadeViewProps) {
  const skeletonOpacity = useRef(new Animated.Value(isLoading ? 1 : 0)).current;
  const contentOpacity = useRef(new Animated.Value(isLoading ? 0 : 1)).current;

  useEffect(() => {
    if (isLoading) {
      // Fade in skeleton, fade out content
      Animated.parallel([
        Animated.timing(skeletonOpacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out skeleton, fade in content
      Animated.parallel([
        Animated.timing(skeletonOpacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, skeletonOpacity, contentOpacity, duration]);

  return (
    <View style={[styles.container, style]}>
      {/* Skeleton layer */}
      <Animated.View
        style={[styles.layer, { opacity: skeletonOpacity }]}
        pointerEvents={isLoading ? "auto" : "none"}
      >
        {skeleton}
      </Animated.View>

      {/* Content layer */}
      <Animated.View
        style={[styles.layer, { opacity: contentOpacity }]}
        pointerEvents={isLoading ? "none" : "auto"}
      >
        {children}
      </Animated.View>
    </View>
  );
}

/**
 * SimpleFadeView provides a simple fade-in animation for content
 * that transitions from skeleton to actual content.
 * Uses a simpler approach without overlapping layers.
 */
export function SimpleFadeView({
  isLoading,
  skeleton,
  children,
  duration = 300,
  style,
}: CrossFadeViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading) {
      // Content just loaded, fade it in
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, opacity, duration]);

  if (isLoading) {
    return <View style={style}>{skeleton}</View>;
  }

  return (
    <Animated.View style={[style, { opacity }]}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
