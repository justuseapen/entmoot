import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";

import { COLORS } from "@/theme/colors";
import { useAuthStore } from "@/stores";
import {
  useFamilies,
  useFamilyMembers,
  useCreateInvitation,
  type Family,
  type FamilyMember,
  type FamilyRole,
} from "@/hooks";
import { LoadingSpinner } from "@/components/ui";

// Role display configuration
const ROLE_LABELS: Record<FamilyRole, string> = {
  admin: "Admin",
  adult: "Adult",
  teen: "Teen",
  child: "Child",
  observer: "Observer",
};

const ROLE_COLORS: Record<FamilyRole, string> = {
  admin: COLORS.primary,
  adult: COLORS.secondary,
  teen: "#9C27B0",
  child: "#FF9800",
  observer: COLORS.textTertiary,
};

// Invitable roles (roles that can be assigned to new invitees)
const INVITABLE_ROLES: FamilyRole[] = ["adult", "teen", "child", "observer"];

// Types
interface FamilyCardProps {
  family: Family;
  isSelected: boolean;
  onPress: () => void;
}

interface MemberRowProps {
  member: FamilyMember;
}

// Family Card Component
function FamilyCard({ family, isSelected, onPress }: FamilyCardProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      style={[styles.familyCard, isSelected && styles.familyCardSelected]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.familyCardContent}>
        <View style={styles.familyIconContainer}>
          <Ionicons name="people" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.familyInfo}>
          <Text style={styles.familyName}>{family.name}</Text>
          <Text style={styles.familyTimezone}>{family.timezone}</Text>
        </View>
      </View>
      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// Member Row Component
function MemberRow({ member }: MemberRowProps) {
  const initials = member.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.memberRow}>
      <View style={styles.memberAvatar}>
        {member.avatar_url ? (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberEmail}>{member.email}</Text>
      </View>
      <View
        style={[
          styles.roleBadge,
          { backgroundColor: ROLE_COLORS[member.role] + "20" },
        ]}
      >
        <Text
          style={[styles.roleBadgeText, { color: ROLE_COLORS[member.role] }]}
        >
          {ROLE_LABELS[member.role]}
        </Text>
      </View>
    </View>
  );
}

// Role Picker Row Component
interface RolePickerRowProps {
  role: FamilyRole;
  isSelected: boolean;
  onPress: () => void;
}

function RolePickerRow({ role, isSelected, onPress }: RolePickerRowProps) {
  return (
    <TouchableOpacity
      style={[styles.rolePickerRow, isSelected && styles.rolePickerRowSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.rolePickerLabel}>{ROLE_LABELS[role]}</Text>
      {isSelected && (
        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );
}

export default function FamilyManagementScreen() {
  const router = useRouter();
  const { currentFamilyId, setCurrentFamily, user } = useAuthStore();

  // State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<FamilyRole>("adult");
  const [showRolePicker, setShowRolePicker] = useState(false);

  // Bottom sheet ref
  const bottomSheetRef = React.useRef<BottomSheet>(null);

  // Queries
  const {
    data: families,
    isLoading: familiesLoading,
    refetch: refetchFamilies,
    isFetching: familiesFetching,
  } = useFamilies();

  const {
    data: members,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useFamilyMembers(currentFamilyId);

  // Mutations
  const createInvitationMutation = useCreateInvitation();

  // Check if current user can invite (admin or adult role)
  const canInvite = useMemo(() => {
    if (!members || !user) return false;
    const currentMembership = members.find((m) => m.user_id === user.id);
    return (
      currentMembership?.role === "admin" || currentMembership?.role === "adult"
    );
  }, [members, user]);

  // Handlers
  const handleSelectFamily = useCallback(
    async (family: Family) => {
      if (family.id === currentFamilyId) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await setCurrentFamily(family.id);

      // Refetch members for new family
      refetchMembers();
    },
    [currentFamilyId, setCurrentFamily, refetchMembers]
  );

  const handleOpenInviteModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInviteEmail("");
    setInviteRole("adult");
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseInviteModal = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleSendInvitation = useCallback(async () => {
    const email = inviteEmail.trim();

    if (!email) {
      Alert.alert("Error", "Please enter an email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await createInvitationMutation.mutateAsync({
        email,
        role: inviteRole,
      });

      handleCloseInviteModal();
      Alert.alert("Success", `Invitation sent to ${email}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send invitation.";
      Alert.alert("Error", message);
    }
  }, [inviteEmail, inviteRole, createInvitationMutation, handleCloseInviteModal]);

  const handleRefresh = useCallback(() => {
    refetchFamilies();
    refetchMembers();
  }, [refetchFamilies, refetchMembers]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Loading state
  if (familiesLoading || membersLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Family</Text>
          <View style={styles.headerSpacer} />
        </View>
        <LoadingSpinner message="Loading..." />
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Family</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={familiesFetching && !familiesLoading}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Families Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Families</Text>
          <View style={styles.familyList}>
            {families?.map((family) => (
              <FamilyCard
                key={family.id}
                family={family}
                isSelected={family.id === currentFamilyId}
                onPress={() => handleSelectFamily(family)}
              />
            ))}
          </View>
          {(!families || families.length === 0) && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No families found</Text>
            </View>
          )}
        </View>

        {/* Members Section */}
        {currentFamilyId && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Family Members</Text>
              {canInvite && (
                <TouchableOpacity
                  style={styles.inviteButton}
                  onPress={handleOpenInviteModal}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.inviteButtonText}>Invite</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.membersList}>
              {members?.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </View>
            {(!members || members.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="person-outline"
                  size={48}
                  color={COLORS.border}
                />
                <Text style={styles.emptyText}>No members found</Text>
              </View>
            )}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Invite Modal */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["55%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.modalTitle}>Invite Family Member</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="Enter email address"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Role Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Role</Text>
            <TouchableOpacity
              style={styles.roleDropdown}
              onPress={() => setShowRolePicker(!showRolePicker)}
              activeOpacity={0.7}
            >
              <Text style={styles.roleDropdownText}>
                {ROLE_LABELS[inviteRole]}
              </Text>
              <Ionicons
                name={showRolePicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>

            {showRolePicker && (
              <View style={styles.rolePickerContainer}>
                {INVITABLE_ROLES.map((role) => (
                  <RolePickerRow
                    key={role}
                    role={role}
                    isSelected={role === inviteRole}
                    onPress={() => {
                      setInviteRole(role);
                      setShowRolePicker(false);
                    }}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              createInvitationMutation.isPending && styles.sendButtonDisabled,
            ]}
            onPress={handleSendInvitation}
            disabled={createInvitationMutation.isPending}
            activeOpacity={0.8}
          >
            {createInvitationMutation.isPending ? (
              <ActivityIndicator size="small" color={COLORS.surface} />
            ) : (
              <>
                <Ionicons name="send" size={18} color={COLORS.surface} />
                <Text style={styles.sendButtonText}>Send Invitation</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCloseInviteModal}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
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
    paddingHorizontal: 16,
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
  headerSpacer: {
    width: 32,
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },

  // Family Card
  familyList: {
    gap: 12,
  },
  familyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  familyCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "08",
  },
  familyCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  familyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  familyTimezone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkmarkContainer: {
    marginLeft: 12,
  },

  // Member Row
  membersList: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  memberAvatar: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
  },
  memberEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Invite Button
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 16,
    gap: 4,
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },

  // Bottom spacer
  bottomSpacer: {
    height: 40,
  },

  // Bottom Sheet
  bottomSheetBackground: {
    backgroundColor: COLORS.surface,
  },
  bottomSheetHandle: {
    backgroundColor: COLORS.border,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 24,
    textAlign: "center",
  },

  // Input Group
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Role Dropdown
  roleDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleDropdownText: {
    fontSize: 16,
    color: COLORS.text,
  },

  // Role Picker
  rolePickerContainer: {
    marginTop: 8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  rolePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rolePickerRowSelected: {
    backgroundColor: COLORS.primary + "10",
  },
  rolePickerLabel: {
    fontSize: 15,
    color: COLORS.text,
  },

  // Send Button
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
  },

  // Cancel Button
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
