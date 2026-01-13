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

type Props = AuthStackScreenProps<"Register">;

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
}

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const { register, isLoading } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

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

    // Password confirmation validation
    if (!passwordConfirmation) {
      newErrors.passwordConfirmation = "Please confirm your password";
    } else if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: passwordConfirmation,
      });
    } catch (error) {
      Alert.alert(
        "Registration Failed",
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your family adventure today</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Your name"
              placeholderTextColor={`${COLORS.earthBrown}80`}
              value={name}
              onChangeText={(text) => {
                setName(text);
                clearFieldError("name");
              }}
              autoCapitalize="words"
              autoComplete="name"
              editable={!isLoading}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="your@email.com"
              placeholderTextColor={`${COLORS.earthBrown}80`}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearFieldError("email");
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
              placeholder="Create a password"
              placeholderTextColor={`${COLORS.earthBrown}80`}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearFieldError("password");
              }}
              secureTextEntry
              autoComplete="password-new"
              editable={!isLoading}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                errors.passwordConfirmation && styles.inputError,
              ]}
              placeholder="Confirm your password"
              placeholderTextColor={`${COLORS.earthBrown}80`}
              value={passwordConfirmation}
              onChangeText={(text) => {
                setPasswordConfirmation(text);
                clearFieldError("passwordConfirmation");
              }}
              secureTextEntry
              autoComplete="password-new"
              editable={!isLoading}
            />
            {errors.passwordConfirmation && (
              <Text style={styles.errorText}>
                {errors.passwordConfirmation}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.creamWhite} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By creating an account, you agree to our Terms of Service and
            Privacy Policy.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            disabled={isLoading}
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
    marginBottom: 32,
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
    marginBottom: 24,
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
  button: {
    backgroundColor: COLORS.forestGreen,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.creamWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  termsText: {
    fontSize: 12,
    color: COLORS.earthBrown,
    textAlign: "center",
    lineHeight: 18,
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
