import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Localization from "expo-localization";
import { COLORS } from "@/theme/colors";
import { H1, H2, Body, Button, Input, Card, PressableCard } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores";

type SetupMode = "select" | "create" | "join";

interface Family {
  id: number;
  name: string;
  timezone: string;
}

interface CreateFamilyResponse {
  id: number;
  name: string;
  timezone: string;
}

interface AcceptInvitationResponse {
  family: Family;
  membership: {
    id: number;
    role: string;
  };
}

export default function FamilySetupScreen() {
  const [mode, setMode] = useState<SetupMode>("select");
  const [familyName, setFamilyName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCurrentFamily = useAuthStore((state) => state.setCurrentFamily);

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      setError("Please enter a family name");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Auto-detect timezone using expo-localization
      const calendars = Localization.getCalendars();
      const timezone = calendars[0]?.timeZone || "UTC";

      const response = await api.post<CreateFamilyResponse>("/families", {
        family: {
          name: familyName.trim(),
          timezone,
        },
      });

      // Set the current family in auth store
      await setCurrentFamily(response.id);

      // Navigate to main app
      router.replace("/(tabs)/today");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create family";
      setError(message);
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!invitationCode.trim()) {
      setError("Please enter an invitation code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<AcceptInvitationResponse>(
        `/invitations/${invitationCode.trim()}/accept`
      );

      // Set the current family in auth store
      await setCurrentFamily(response.family.id);

      // Navigate to main app
      router.replace("/(tabs)/today");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to join family";
      setError(message);
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setMode("select");
    setError(null);
    setFamilyName("");
    setInvitationCode("");
  };

  // Selection mode - choose between create or join
  if (mode === "select") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={60} color={COLORS.primary} />
            </View>
            <H1 style={styles.title}>Set Up Your Family</H1>
            <Body style={styles.subtitle}>
              Create a new family or join an existing one with an invitation code.
            </Body>
          </View>

          <View style={styles.optionsContainer}>
            <PressableCard
              style={styles.optionCard}
              variant="outlined"
              padding="large"
              onPress={() => setMode("create")}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionIconContainer}>
                  <Ionicons name="add-circle" size={40} color={COLORS.primary} />
                </View>
                <H2 style={styles.optionTitle}>Create a Family</H2>
                <Body style={styles.optionDescription}>
                  Start fresh and invite your family members later.
                </Body>
              </View>
            </PressableCard>

            <PressableCard
              style={styles.optionCard}
              variant="outlined"
              padding="large"
              onPress={() => setMode("join")}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionIconContainer}>
                  <Ionicons name="enter" size={40} color={COLORS.secondary} />
                </View>
                <H2 style={styles.optionTitle}>Join a Family</H2>
                <Body style={styles.optionDescription}>
                  Enter an invitation code to join an existing family.
                </Body>
              </View>
            </PressableCard>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Create family mode
  if (mode === "create") {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.formHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="home" size={50} color={COLORS.primary} />
              </View>
              <H1 style={styles.title}>Create Your Family</H1>
              <Body style={styles.subtitle}>
                Give your family a name. You can invite members once it's created.
              </Body>
            </View>

            <Card style={styles.formCard} padding="large">
              <Input
                label="Family Name"
                placeholder="e.g., The Smiths"
                value={familyName}
                onChangeText={(text) => {
                  setFamilyName(text);
                  if (error) setError(null);
                }}
                error={error || undefined}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleCreateFamily}
              />

              <Text style={styles.timezoneInfo}>
                <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                {"  "}Your timezone will be automatically detected
              </Text>
            </Card>

            <View style={styles.buttonContainer}>
              <Button
                fullWidth
                size="large"
                onPress={handleCreateFamily}
                loading={isLoading}
                disabled={!familyName.trim() || isLoading}
              >
                Create Family
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Join family mode
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.formHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="key" size={50} color={COLORS.secondary} />
            </View>
            <H1 style={styles.title}>Join a Family</H1>
            <Body style={styles.subtitle}>
              Enter the invitation code shared by a family member.
            </Body>
          </View>

          <Card style={styles.formCard} padding="large">
            <Input
              label="Invitation Code"
              placeholder="Enter your code"
              value={invitationCode}
              onChangeText={(text) => {
                setInvitationCode(text);
                if (error) setError(null);
              }}
              error={error || undefined}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleJoinFamily}
            />
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              fullWidth
              size="large"
              onPress={handleJoinFamily}
              loading={isLoading}
              disabled={!invitationCode.trim() || isLoading}
            >
              Join Family
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginLeft: -8,
    marginBottom: 16,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 48,
  },
  formHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    color: COLORS.text,
  },
  subtitle: {
    textAlign: "center",
    color: COLORS.textSecondary,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    marginBottom: 0,
  },
  optionContent: {
    alignItems: "center",
  },
  optionIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  optionTitle: {
    textAlign: "center",
    marginBottom: 8,
    color: COLORS.text,
  },
  optionDescription: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  formCard: {
    marginBottom: 24,
  },
  timezoneInfo: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    marginTop: "auto",
    paddingTop: 24,
  },
});
