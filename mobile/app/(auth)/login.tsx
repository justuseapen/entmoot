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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { login, isLoading } = useAuthStore();

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

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
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login({ email: email.trim(), password });
      router.replace("/(tabs)/today");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      Alert.alert("Login Failed", message);
    }
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };

  const handleCreateAccount = () => {
    router.push("/(auth)/register");
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
          <H1 style={styles.title}>Welcome Back</H1>
          <Body color={COLORS.textSecondary}>Sign in to your account</Body>
        </View>

        <View style={styles.form}>
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
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              error={passwordError}
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

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPasswordButton}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            variant="primary"
            size="large"
            fullWidth
            loading={isLoading}
            onPress={handleLogin}
            style={styles.loginButton}
          >
            Log In
          </Button>
        </View>

        <View style={styles.footer}>
          <Body color={COLORS.textSecondary}>Don't have an account? </Body>
          <TouchableOpacity onPress={handleCreateAccount} disabled={isLoading}>
            <Text style={styles.createAccountText}>Create Account</Text>
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
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
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
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
  },
  createAccountText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
