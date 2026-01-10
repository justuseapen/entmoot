import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getFamilies,
  getFamily,
  createFamily,
  updateFamily,
  deleteFamily,
  getInvitations,
  sendInvitation,
  resendInvitation,
  cancelInvitation,
  getMembers,
  updateMemberRole,
  removeMember,
  type CreateFamilyData,
  type UpdateFamilyData,
  type InvitationData,
  type MemberRole,
} from "@/lib/families";

// Query keys
export const familyKeys = {
  all: ["families"] as const,
  lists: () => [...familyKeys.all, "list"] as const,
  list: () => [...familyKeys.lists()] as const,
  details: () => [...familyKeys.all, "detail"] as const,
  detail: (id: number) => [...familyKeys.details(), id] as const,
  invitations: (familyId: number) =>
    [...familyKeys.detail(familyId), "invitations"] as const,
  members: (familyId: number) =>
    [...familyKeys.detail(familyId), "members"] as const,
};

// Families queries
export function useFamilies() {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: familyKeys.list(),
    queryFn: () => getFamilies(token!),
    enabled: !!token,
    select: (data) => data.families,
  });
}

export function useFamily(id: number) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: familyKeys.detail(id),
    queryFn: () => getFamily(id, token!),
    enabled: !!token && !!id,
    select: (data) => data.family,
  });
}

// Family mutations
export function useCreateFamily() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFamilyData) => createFamily(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.lists() });
    },
  });
}

export function useUpdateFamily(id: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFamilyData) => updateFamily(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: familyKeys.lists() });
    },
  });
}

export function useDeleteFamily(id: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteFamily(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.lists() });
    },
  });
}

// Invitations queries and mutations
export function useInvitations(familyId: number) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: familyKeys.invitations(familyId),
    queryFn: () => getInvitations(familyId, token!),
    enabled: !!token && !!familyId,
    select: (data) => data.invitations,
  });
}

export function useSendInvitation(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InvitationData) =>
      sendInvitation(familyId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: familyKeys.invitations(familyId),
      });
    },
  });
}

export function useResendInvitation(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: number) =>
      resendInvitation(familyId, invitationId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: familyKeys.invitations(familyId),
      });
    },
  });
}

export function useCancelInvitation(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: number) =>
      cancelInvitation(familyId, invitationId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: familyKeys.invitations(familyId),
      });
    },
  });
}

// Membership queries and mutations
export function useMembers(familyId: number) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: familyKeys.members(familyId),
    queryFn: () => getMembers(familyId, token!),
    enabled: !!token && !!familyId,
    select: (data) => data.members,
  });
}

export function useUpdateMemberRole(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      membershipId,
      role,
    }: {
      membershipId: number;
      role: MemberRole;
    }) => updateMemberRole(familyId, membershipId, role, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.members(familyId) });
    },
  });
}

export function useRemoveMember(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (membershipId: number) =>
      removeMember(familyId, membershipId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.members(familyId) });
    },
  });
}
