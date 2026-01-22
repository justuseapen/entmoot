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

import { apiFetch } from "@/lib/api";
import { Input, Button, H1, Body } from "@/components/ui";
import { COLORS } from "@/theme/colors";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSendResetLink = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await apiFetch("/auth/password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });

      Alert.alert(
        "Check Your Email",
        "If an account with that email exists, we've sent password reset instructions.",
        [
          {
            text: "Back to Login",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send reset link. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
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
        <TouchableOpacity
          onPress={handleBackToLogin}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <H1 style={styles.title}>Reset Password</H1>
          <Body color={COLORS.textSecondary}>
            Enter your email address and we'll send you instructions to reset
            your password.
          </Body>
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

          <Button
            variant="primary"
            size="large"
            fullWidth
            loading={isLoading}
            onPress={handleSendResetLink}
            style={styles.sendButton}
          >
            Send Reset Link
          </Button>
        </View>

        <View style={styles.footer}>
          <Body color={COLORS.textSecondary}>Remember your password? </Body>
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
  backButton: {
    marginBottom: 24,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
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
  sendButton: {
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
