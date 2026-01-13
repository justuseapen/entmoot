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
  Alert,
} from "react-native";
import type { AuthStackScreenProps } from "../../navigation/types";
import { useAuthStore } from "../../stores";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  creamWhite: "#FFF8E7",
  earthBrown: "#795548",
  darkForest: "#1B3A1A",
  errorRed: "#DC2626",
};

type Props = AuthStackScreenProps<"Login">;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const { login, isLoading } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Entmoot</Text>
          <Text style={styles.tagline}>Build Your Family&apos;s Adventure</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your adventure
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="your@email.com"
              placeholderTextColor={`${COLORS.earthBrown}80`}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Enter your password"
              placeholderTextColor={`${COLORS.earthBrown}80`}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              secureTextEntry
              autoComplete="password"
              editable={!isLoading}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate("ForgotPassword")}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.creamWhite} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            disabled={isLoading}
          >
            <Text style={styles.footerLink}>Create Account</Text>
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
  },
  inputContainer: {
    marginBottom: 16,
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
  },
  inputError: {
    borderColor: COLORS.errorRed,
  },
  errorText: {
    color: COLORS.errorRed,
    fontSize: 12,
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.forestGreen,
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    backgroundColor: COLORS.forestGreen,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
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
});
