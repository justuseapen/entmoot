import React from "react";
import { View, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import { COLORS } from "@/theme/colors";
import { Typography } from "./Typography";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = "large",
  color = COLORS.primary,
  message,
  fullScreen = false,
  style,
}: LoadingSpinnerProps) {
  const containerStyles = [
    styles.container,
    fullScreen && styles.fullScreen,
    style,
  ].filter(Boolean);

  return (
    <View style={containerStyles}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Typography
          variant="body"
          color={COLORS.textSecondary}
          style={styles.message}
        >
          {message}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  message: {
    marginTop: 12,
    textAlign: "center",
  },
});
