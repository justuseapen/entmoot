import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";

/**
 * HTTP status code to user-friendly message mapping
 */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: "The request was invalid. Please check your input and try again.",
  401: "You need to log in to continue.",
  403: "You don't have permission to perform this action.",
  404: "The requested item could not be found.",
  408: "The request timed out. Please check your connection and try again.",
  409: "There's a conflict with the current state. Please refresh and try again.",
  422: "The data you submitted is invalid. Please check and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our servers. Please try again later.",
  502: "We're having trouble connecting. Please try again later.",
  503: "The service is temporarily unavailable. Please try again later.",
  504: "The request timed out. Please try again later.",
};

/**
 * Get a user-friendly error message from an HTTP status code
 */
export function getErrorMessageFromStatus(statusCode: number): string {
  return (
    HTTP_ERROR_MESSAGES[statusCode] ||
    "An unexpected error occurred. Please try again."
  );
}

/**
 * Parse an error and return a user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  // Check for Error object with message
  if (error instanceof Error) {
    // Check for network errors
    if (
      error.message.includes("Network request failed") ||
      error.message.includes("Failed to fetch")
    ) {
      return "Unable to connect. Please check your internet connection and try again.";
    }

    // Check for timeout errors
    if (error.message.includes("timeout") || error.message.includes("Timeout")) {
      return "The request timed out. Please try again.";
    }

    // Check for abort errors
    if (error.name === "AbortError") {
      return "The request was cancelled. Please try again.";
    }

    // Try to extract status code from error message (common pattern: "HTTP 404" or "404 Not Found")
    const statusMatch = error.message.match(/\b([45]\d{2})\b/);
    if (statusMatch) {
      const statusCode = parseInt(statusMatch[1], 10);
      return getErrorMessageFromStatus(statusCode);
    }

    // Return the error message if it's user-friendly (not a stack trace or technical message)
    const message = error.message;
    if (message && message.length < 200 && !message.includes("at ")) {
      return message;
    }
  }

  // Check for API error response objects
  if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, unknown>;

    // Check for status property
    if (typeof errorObj.status === "number") {
      return getErrorMessageFromStatus(errorObj.status);
    }

    // Check for message property
    if (typeof errorObj.message === "string") {
      return errorObj.message;
    }

    // Check for error property (common in API responses)
    if (typeof errorObj.error === "string") {
      return errorObj.error;
    }

    // Check for errors array (Rails validation errors)
    if (Array.isArray(errorObj.errors) && errorObj.errors.length > 0) {
      return errorObj.errors[0];
    }
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Get appropriate icon name based on error type
 */
function getErrorIcon(error: unknown): keyof typeof Ionicons.glyphMap {
  if (!error) return "alert-circle-outline";

  const message = getErrorMessage(error).toLowerCase();

  if (message.includes("connect") || message.includes("network")) {
    return "cloud-offline-outline";
  }

  if (message.includes("timeout")) {
    return "time-outline";
  }

  if (message.includes("permission") || message.includes("log in")) {
    return "lock-closed-outline";
  }

  if (message.includes("not found")) {
    return "search-outline";
  }

  if (message.includes("server")) {
    return "server-outline";
  }

  return "alert-circle-outline";
}

type ErrorMessageVariant = "default" | "inline" | "card";

interface ErrorMessageProps {
  /** The error object or message to display */
  error?: unknown;
  /** Custom title (defaults based on error type) */
  title?: string;
  /** Custom message (overrides automatic message extraction) */
  message?: string;
  /** Whether to show the retry button */
  showRetry?: boolean;
  /** Callback for retry button press */
  onRetry?: () => void;
  /** Visual variant of the error message */
  variant?: ErrorMessageVariant;
  /** Whether retry is currently in progress */
  isRetrying?: boolean;
  /** Custom style for the container */
  style?: StyleProp<ViewStyle>;
  /** Whether the error message should be full screen */
  fullScreen?: boolean;
}

/**
 * ErrorMessage component for displaying API errors and other error states
 * in a user-friendly way.
 */
export function ErrorMessage({
  error,
  title = "Something went wrong",
  message,
  showRetry = true,
  onRetry,
  variant = "default",
  isRetrying = false,
  style,
  fullScreen = false,
}: ErrorMessageProps): React.ReactElement {
  const errorMessage = message || getErrorMessage(error);
  const iconName = getErrorIcon(error);

  // Inline variant - minimal, single line
  if (variant === "inline") {
    return (
      <View style={[styles.inlineContainer, style]}>
        <Ionicons name={iconName} size={16} color={COLORS.error} />
        <Text style={styles.inlineText} numberOfLines={2}>
          {errorMessage}
        </Text>
        {showRetry && onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            disabled={isRetrying}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.inlineRetry, isRetrying && styles.retryDisabled]}>
              {isRetrying ? "Retrying..." : "Retry"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Card variant - contained in a card with border
  if (variant === "card") {
    return (
      <View style={[styles.cardContainer, style]}>
        <View style={styles.cardContent}>
          <View style={styles.cardIconContainer}>
            <Ionicons name={iconName} size={24} color={COLORS.error} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardMessage} numberOfLines={3}>
              {errorMessage}
            </Text>
          </View>
        </View>
        {showRetry && onRetry && (
          <TouchableOpacity
            style={[styles.cardRetryButton, isRetrying && styles.retryButtonDisabled]}
            onPress={onRetry}
            disabled={isRetrying}
            activeOpacity={0.7}
          >
            <Ionicons
              name="refresh"
              size={16}
              color={isRetrying ? COLORS.textTertiary : COLORS.primary}
            />
            <Text
              style={[
                styles.cardRetryText,
                isRetrying && styles.retryTextDisabled,
              ]}
            >
              {isRetrying ? "Retrying..." : "Try Again"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Default variant - centered, prominent display
  const containerStyle = [
    styles.defaultContainer,
    fullScreen && styles.fullScreenContainer,
    style,
  ];

  return (
    <View style={containerStyle}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={48} color={COLORS.error} />
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Message */}
      <Text style={styles.message}>{errorMessage}</Text>

      {/* Retry Button */}
      {showRetry && onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
          onPress={onRetry}
          disabled={isRetrying}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isRetrying ? "hourglass-outline" : "refresh"}
            size={18}
            color={isRetrying ? COLORS.textTertiary : COLORS.textOnPrimary}
            style={styles.retryButtonIcon}
          />
          <Text
            style={[
              styles.retryButtonText,
              isRetrying && styles.retryTextDisabled,
            ]}
          >
            {isRetrying ? "Retrying..." : "Try Again"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Default variant styles
  defaultContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.errorLight + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 300,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 140,
  },
  retryButtonDisabled: {
    backgroundColor: COLORS.surfaceVariant,
  },
  retryButtonIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },
  retryTextDisabled: {
    color: COLORS.textTertiary,
  },

  // Inline variant styles
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.errorLight + "10",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  inlineText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 8,
    marginRight: 8,
  },
  inlineRetry: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  retryDisabled: {
    color: COLORS.textTertiary,
  },

  // Card variant styles
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.errorLight + "40",
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.errorLight + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cardRetryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surfaceVariant + "50",
  },
  cardRetryText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.primary,
    marginLeft: 6,
  },
});
