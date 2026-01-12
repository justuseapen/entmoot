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
  const { token, setAuth, user, refreshToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      if (!token) throw new Error("Not authenticated");
      return updateProfile(token, data);
    },
    onSuccess: (response) => {
      // Update the auth store with the new user data
      if (user && token && refreshToken) {
        setAuth(response.user, token, refreshToken);
      }
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useChangePassword() {
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      if (!token) throw new Error("Not authenticated");
      return changePassword(token, data);
    },
  });
}

export function useDeleteAccount() {
  const { token, logout } = useAuthStore();

  return useMutation({
    mutationFn: async (data: DeleteAccountData) => {
      if (!token) throw new Error("Not authenticated");
      return deleteAccount(token, data);
    },
    onSuccess: () => {
      // Clear auth state after account deletion
      logout();
    },
  });
}

export function useExportUserData() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["user", "export"],
    queryFn: async () => {
      if (!token) throw new Error("Not authenticated");
      return exportUserData(token);
    },
    enabled: false, // Only fetch when manually triggered
  });
}

export function useExportUserDataMutation() {
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Not authenticated");
      return exportUserData(token);
    },
  });
}
