import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  ViewProps,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { COLORS } from "@/theme/colors";

interface CardProps extends ViewProps {
  variant?: "default" | "outlined" | "elevated";
  padding?: "none" | "small" | "medium" | "large";
  children: React.ReactNode;
}

interface PressableCardProps extends TouchableOpacityProps {
  variant?: "default" | "outlined" | "elevated";
  padding?: "none" | "small" | "medium" | "large";
  children: React.ReactNode;
}

export function Card({
  variant = "default",
  padding = "medium",
  style,
  children,
  ...rest
}: CardProps) {
  const containerStyles: ViewStyle[] = [
    styles.base,
    styles[`${variant}Variant`],
    styles[`${padding}Padding`],
  ].filter(Boolean) as ViewStyle[];

  return (
    <View style={[containerStyles, style]} {...rest}>
      {children}
    </View>
  );
}

export function PressableCard({
  variant = "default",
  padding = "medium",
  style,
  children,
  ...rest
}: PressableCardProps) {
  const containerStyles: ViewStyle[] = [
    styles.base,
    styles[`${variant}Variant`],
    styles[`${padding}Padding`],
  ].filter(Boolean) as ViewStyle[];

  return (
    <TouchableOpacity
      style={[containerStyles, style]}
      activeOpacity={0.7}
      {...rest}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },

  // Variants
  defaultVariant: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  outlinedVariant: {
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  elevatedVariant: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // Padding
  nonePadding: {
    padding: 0,
  },
  smallPadding: {
    padding: 12,
  },
  mediumPadding: {
    padding: 16,
  },
  largePadding: {
    padding: 24,
  },
});
