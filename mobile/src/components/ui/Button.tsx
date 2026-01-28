import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  AccessibilityRole,
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
  /** Accessibility label for screen readers - defaults to children text if string */
  accessibilityLabel?: string;
  /** Accessibility hint describing what happens when the button is pressed */
  accessibilityHint?: string;
  /** Test ID for E2E testing */
  testID?: string;
}

export function Button({
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
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

  // Derive accessibility label from children if not provided
  const derivedAccessibilityLabel =
    accessibilityLabel ||
    (typeof children === "string" ? children : undefined);

  // Build accessibility state
  const accessibilityState = {
    disabled: isDisabled,
    busy: loading,
  };

  return (
    <TouchableOpacity
      style={[containerStyles, style]}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={derivedAccessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      testID={testID}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={spinnerColor}
          accessibilityLabel="Loading"
        />
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

  // Size containers - minimum 44px height for iOS HIG touch target compliance
  smallContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
  },
  mediumContainer: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
  },
  largeContainer: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 48,
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
