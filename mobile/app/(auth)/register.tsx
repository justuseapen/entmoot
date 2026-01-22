import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Text,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@/stores/auth";
import { Input, Button, H1, Body } from "@/components/ui";
import { COLORS } from "@/theme/colors";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const { register, isLoading } = useAuthStore();

  const validateForm = (): boolean => {
    let isValid = true;
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!name.trim()) {
      setNameError("Name is required");
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirmPassword,
      });
      router.replace("/onboarding");
    } catch (error) {
      // Handle API validation errors
      if (error instanceof Error) {
        const errorMessage = error.message;

        // Try to parse error message as JSON for field-level errors
        try {
          const errors = JSON.parse(errorMessage);
          if (errors.email) {
            setEmailError(
              Array.isArray(errors.email) ? errors.email[0] : errors.email
            );
          }
          if (errors.password) {
            setPasswordError(
              Array.isArray(errors.password)
                ? errors.password[0]
                : errors.password
            );
          }
          if (errors.name) {
            setNameError(
              Array.isArray(errors.name) ? errors.name[0] : errors.name
            );
          }
          if (errors.password_confirmation) {
            setConfirmPasswordError(
              Array.isArray(errors.password_confirmation)
                ? errors.password_confirmation[0]
                : errors.password_confirmation
            );
          }
          // If no specific field errors, show general alert
          if (
            !errors.email &&
            !errors.password &&
            !errors.name &&
            !errors.password_confirmation
          ) {
            Alert.alert(
              "Registration Failed",
              errors.error || "Please check your information and try again."
            );
          }
        } catch {
          // Not JSON, show as general error
          Alert.alert("Registration Failed", errorMessage);
        }
      } else {
        Alert.alert(
          "Registration Failed",
          "An unexpected error occurred. Please try again."
        );
      }
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <H1 style={styles.title}>Create Account</H1>
          <Body color={COLORS.textSecondary}>
            Sign up to start planning with your family
          </Body>
        </View>

        <View style={styles.form}>
          <Input
            label="Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError("");
            }}
            placeholder="Enter your name"
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="name"
            error={nameError}
            editable={!isLoading}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError("");
            }}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            error={emailError}
            editable={!isLoading}
          />

          <View style={styles.passwordContainer}>
            <Input
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError("");
              }}
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              error={passwordError}
              helperText="Must be at least 8 characters"
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError("");
              }}
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              error={confirmPasswordError}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Button
            variant="primary"
            size="large"
            fullWidth
            loading={isLoading}
            onPress={handleRegister}
            style={styles.createButton}
          >
            Create Account
          </Button>
        </View>

        <View style={styles.footer}>
          <Body color={COLORS.textSecondary}>Already have an account? </Body>
          <TouchableOpacity onPress={handleBackToLogin} disabled={isLoading}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  form: {
    marginBottom: 32,
  },
  passwordContainer: {
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 38,
    padding: 4,
  },
  createButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
  },
  loginText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
