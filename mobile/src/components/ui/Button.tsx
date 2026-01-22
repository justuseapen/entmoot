import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from "react-native";
import { COLORS } from "@/theme/colors";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "small" | "medium" | "large";

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyles: ViewStyle[] = [
    styles.base,
    styles[`${variant}Container`],
    styles[`${size}Container`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDisabled && styles.disabledText,
  ].filter(Boolean) as TextStyle[];

  const spinnerColor =
    variant === "primary" || variant === "secondary"
      ? COLORS.textOnPrimary
      : COLORS.primary;

  return (
    <TouchableOpacity
      style={[containerStyles, style]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },

  // Variant containers
  primaryContainer: {
    backgroundColor: COLORS.primary,
  },
  secondaryContainer: {
    backgroundColor: COLORS.secondary,
  },
  outlineContainer: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghostContainer: {
    backgroundColor: "transparent",
  },

  // Size containers
  smallContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  mediumContainer: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  largeContainer: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },

  // Base text
  text: {
    fontWeight: "600",
    textAlign: "center",
  },

  // Variant text
  primaryText: {
    color: COLORS.textOnPrimary,
  },
  secondaryText: {
    color: COLORS.textOnSecondary,
  },
  outlineText: {
    color: COLORS.primary,
  },
  ghostText: {
    color: COLORS.primary,
  },

  // Size text
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  disabledText: {
    opacity: 0.7,
  },
});
