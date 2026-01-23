import React, { Component, type ReactNode, type ErrorInfo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI.
 *
 * Class component is required for componentDidCatch lifecycle method.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = (): void => {
    // Reset the error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call the optional onReset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Error Icon */}
              <View style={styles.iconContainer}>
                <Ionicons
                  name="warning-outline"
                  size={80}
                  color={COLORS.error}
                />
              </View>

              {/* Error Title */}
              <Text style={styles.title}>Something went wrong</Text>

              {/* Error Description */}
              <Text style={styles.description}>
                We encountered an unexpected error. Don&apos;t worry, your data
                is safe. Please try again.
              </Text>

              {/* Error Details (development only) */}
              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorLabel}>Error Details:</Text>
                  <Text style={styles.errorText}>
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo?.componentStack && (
                    <Text style={styles.stackTrace}>
                      {this.state.errorInfo.componentStack
                        .split("\n")
                        .slice(0, 5)
                        .join("\n")}
                    </Text>
                  )}
                </View>
              )}

              {/* Retry Button */}
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="refresh"
                  size={20}
                  color={COLORS.textOnPrimary}
                  style={styles.retryIcon}
                />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>

              {/* Secondary Action */}
              <Text style={styles.helpText}>
                If the problem persists, try restarting the app.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.errorLight + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  errorDetails: {
    width: "100%",
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.error,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.text,
    fontFamily: "monospace",
    marginBottom: 8,
  },
  stackTrace: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 160,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textOnPrimary,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: "center",
  },
});
