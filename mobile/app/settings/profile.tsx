import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { COLORS } from "@/theme/colors";
import { useAuthStore } from "@/stores";
import { api } from "@/lib/api";
import type { User } from "@shared/types";

// Update profile response type
interface UpdateProfileResponse {
  user: User;
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Form state
  const [name, setName] = useState(user?.name || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(
    user?.avatar_url || null
  );
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync from user state
  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUri(user.avatar_url);
    }
  }, [user]);

  // Check for changes
  useEffect(() => {
    const nameChanged = name !== (user?.name || "");
    setHasChanges(nameChanged || avatarChanged);
  }, [name, user?.name, avatarChanged]);

  // Pick image from camera or library
  const pickImage = useCallback(async (source: "camera" | "library") => {
    try {
      // Request permissions
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Camera access is required to take a photo. Please enable it in Settings.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => {
                  // On iOS, this opens the app settings
                  if (Platform.OS === "ios") {
                    import("react-native").then(({ Linking }) => {
                      Linking.openURL("app-settings:");
                    });
                  }
                },
              },
            ]
          );
          return;
        }
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Photo library access is required to select a photo. Please enable it in Settings.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => {
                  if (Platform.OS === "ios") {
                    import("react-native").then(({ Linking }) => {
                      Linking.openURL("app-settings:");
                    });
                  }
                },
              },
            ]
          );
          return;
        }
      }

      // Launch picker
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
        setAvatarChanged(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("[Profile] Failed to pick image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  }, []);

  // Handle avatar selection
  const handleAvatarPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await pickImage("camera");
          } else if (buttonIndex === 2) {
            await pickImage("library");
          }
        }
      );
    } else {
      // For Android, show an Alert with options
      Alert.alert("Change Profile Photo", "Choose an option", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: () => pickImage("camera") },
        { text: "Choose from Library", onPress: () => pickImage("library") },
      ]);
    }
  }, [pickImage]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSaving(true);

    try {
      // Note: For avatar uploads, in a real app you would first upload the image
      // to a storage service (like S3) and then send the URL to the backend.
      // For now, we only update the name since the backend expects avatar_url as a URL string.
      const payload: { name?: string; avatar_url?: string } = {};

      if (name !== user?.name) {
        payload.name = name;
      }

      // TODO: Implement image upload to cloud storage for avatar
      // For now, if avatar changed but we don't have a URL, we skip it
      if (avatarChanged && avatarUri && !avatarUri.startsWith("file://")) {
        payload.avatar_url = avatarUri;
      }

      const response = await api.patch<UpdateProfileResponse>(
        "/users/me/profile",
        payload
      );

      // Update the auth store with new user data
      if (response.user) {
        useAuthStore.setState({ user: response.user });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Profile updated successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("[Profile] Failed to update profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, name, user?.name, avatarChanged, avatarUri, router]);

  // Get user initials for placeholder avatar
  const getInitials = useCallback((fullName: string) => {
    return fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasChanges || isSaving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                !hasChanges && styles.saveButtonTextDisabled,
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
            activeOpacity={0.8}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {getInitials(name || user?.name || "U")}
                </Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={16} color={COLORS.surface} />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="done"
              editable={!isSaving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{user?.email || ""}</Text>
              <Text style={styles.readOnlyHint}>
                Email cannot be changed here
              </Text>
            </View>
          </View>
        </View>

        {/* Avatar upload note */}
        {avatarChanged && avatarUri?.startsWith("file://") && (
          <View style={styles.noteSection}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.textSecondary}
            />
            <Text style={styles.noteText}>
              Avatar upload to cloud storage is not yet implemented. Only name
              changes will be saved.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "15",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  saveButtonTextDisabled: {
    color: COLORS.textTertiary,
  },

  // Avatar Section
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  avatarContainer: {
    position: "relative",
    width: 120,
    height: 120,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: "600",
    color: COLORS.surface,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Form Section
  formSection: {
    paddingHorizontal: 16,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  readOnlyInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    opacity: 0.7,
  },
  readOnlyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  readOnlyHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },

  // Note Section
  noteSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 24,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
