import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  updateProfile,
  changePassword,
  deleteAccount,
  exportUserData,
  type UpdateProfileData,
  type ChangePasswordData,
  type DeleteAccountData,
} from "@/lib/profile";

export function useUpdateProfile() {
  const { setUser, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      if (!isAuthenticated) throw new Error("Not authenticated");
      return updateProfile(data);
    },
    onSuccess: (response) => {
      // Update the auth store with the new user data
      setUser(response.user);
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useChangePassword() {
  const { isAuthenticated } = useAuthStore();

  return useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      if (!isAuthenticated) throw new Error("Not authenticated");
      return changePassword(data);
    },
  });
}

export function useDeleteAccount() {
  const { isAuthenticated, logout } = useAuthStore();

  return useMutation({
    mutationFn: async (data: DeleteAccountData) => {
      if (!isAuthenticated) throw new Error("Not authenticated");
      return deleteAccount(data);
    },
    onSuccess: () => {
      // Clear auth state after account deletion
      logout();
    },
  });
}

export function useExportUserData() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["user", "export"],
    queryFn: async () => {
      if (!isAuthenticated) throw new Error("Not authenticated");
      return exportUserData();
    },
    enabled: false, // Only fetch when manually triggered
  });
}

export function useExportUserDataMutation() {
  const { isAuthenticated } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) throw new Error("Not authenticated");
      return exportUserData();
    },
  });
}
