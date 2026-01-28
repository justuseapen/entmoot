import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import type { AuthStackScreenProps } from "../../navigation/types";
import { requestPasswordReset } from "../../lib/auth";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  creamWhite: "#FFF8E7",
  earthBrown: "#795548",
  darkForest: "#1B3A1A",
  errorRed: "#DC2626",
  successGreen: "#16A34A",
};

type Props = AuthStackScreenProps<"ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    setError(null);
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setIsSuccess(true);
    } catch {
      // Even if the email doesn't exist, we show success for security
      // The backend should also handle this the same way
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.container} accessibilityRole="none">
        <View style={styles.successContainer} accessible={true} accessibilityRole="alert">
          <View style={styles.successIcon} accessibilityLabel="Success">
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle} accessibilityRole="header">Check Your Email</Text>
          <Text style={styles.successMessage} accessibilityRole="text">
            If an account exists for {email}, we&apos;ve sent password reset
            instructions to that email address.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
            accessibilityRole="button"
            accessibilityLabel="Back to Sign In"
            accessibilityHint="Return to the sign in page"
            testID="forgot-password-back-to-login"
          >
            <Text style={styles.buttonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header} accessible={true} accessibilityRole="header">
          <Text style={styles.logo} accessibilityRole="text">Entmoot</Text>
          <Text style={styles.tagline} accessibilityRole="text">Build Your Family&apos;s Adventure</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title} accessibilityRole="header">Forgot Password?</Text>
          <Text style={styles.subtitle} accessibilityRole="text">
            No worries! Enter your email and we&apos;ll send you reset
            instructions.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label} nativeID="forgot-email-label">Email</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="your@email.com"
              placeholderTextColor={`${COLORS.earthBrown}80`}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isLoading}
              accessibilityLabel="Email address"
              accessibilityHint="Enter the email address associated with your account"
              accessibilityLabelledBy="forgot-email-label"
              accessibilityState={{ disabled: isLoading }}
              testID="forgot-password-email-input"
            />
            {error && <Text style={styles.errorText} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={isLoading ? "Sending reset link" : "Send Reset Link"}
            accessibilityHint="Send password reset instructions to your email"
            accessibilityState={{ disabled: isLoading, busy: isLoading }}
            testID="forgot-password-submit-button"
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.creamWhite} accessibilityLabel="Loading" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer} accessible={true} accessibilityRole="text">
          <Text style={styles.footerText}>Remember your password?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            disabled={isLoading}
            accessibilityRole="link"
            accessibilityLabel="Sign In"
            accessibilityHint="Navigate to sign in page"
            accessibilityState={{ disabled: isLoading }}
            testID="forgot-password-login-link"
          >
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.creamWhite,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.forestGreen,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.earthBrown,
  },
  form: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.darkForest,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.earthBrown,
    marginBottom: 24,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkForest,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: `${COLORS.earthBrown}40`,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.darkForest,
    backgroundColor: "#FFFFFF",
    minHeight: 44, // iOS HIG touch target compliance
  },
  inputError: {
    borderColor: COLORS.errorRed,
  },
  errorText: {
    color: COLORS.errorRed,
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: COLORS.forestGreen,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 48, // iOS HIG touch target compliance (larger for primary action)
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.creamWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    color: COLORS.earthBrown,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.forestGreen,
    fontSize: 14,
    fontWeight: "600",
  },
  // Success state styles
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.successGreen,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successIconText: {
    color: COLORS.creamWhite,
    fontSize: 40,
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.darkForest,
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.earthBrown,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
});
