import React, { useId } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { COLORS } from "@/theme/colors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  /** Accessibility label for screen readers - defaults to label prop if provided */
  accessibilityLabel?: string;
  /** Accessibility hint describing the input's purpose */
  accessibilityHint?: string;
  /** Test ID for E2E testing */
  testID?: string;
}

export function Input({
  label,
  error,
  helperText,
  containerStyle,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...rest
}: InputProps) {
  const hasError = Boolean(error);
  const inputId = useId();

  // Derive accessibility label from label prop if not explicitly provided
  const derivedAccessibilityLabel = accessibilityLabel || label;

  // Build accessibility state
  const accessibilityState = {
    disabled: rest.editable === false,
  };

  // Combine hint with error for screen reader announcement
  const combinedHint = hasError
    ? `Error: ${error}${accessibilityHint ? `. ${accessibilityHint}` : ""}`
    : accessibilityHint;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={styles.label}
          nativeID={`${inputId}-label`}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[styles.input, hasError && styles.inputError, style]}
        placeholderTextColor={COLORS.textTertiary}
        accessibilityLabel={derivedAccessibilityLabel}
        accessibilityHint={combinedHint}
        accessibilityState={accessibilityState}
        accessibilityLabelledBy={label ? `${inputId}-label` : undefined}
        testID={testID}
        {...rest}
      />
      {hasError && (
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
      {!hasError && helperText && (
        <Text style={styles.helperText} accessibilityRole="text">
          {helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 44, // iOS HIG touch target compliance
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
