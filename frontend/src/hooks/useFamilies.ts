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
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: familyKeys.list(),
    queryFn: () => getFamilies(),
    enabled: isAuthenticated,
    select: (data) => data.families,
  });
}

export function useFamily(id: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: familyKeys.detail(id),
    queryFn: () => getFamily(id),
    enabled: isAuthenticated && !!id,
    select: (data) => data.family,
  });
}

// Family mutations
export function useCreateFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFamilyData) => createFamily(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.lists() });
    },
  });
}

export function useUpdateFamily(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFamilyData) => updateFamily(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: familyKeys.lists() });
    },
  });
}

export function useDeleteFamily(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteFamily(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.lists() });
    },
  });
}

// Invitations queries and mutations
export function useInvitations(familyId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: familyKeys.invitations(familyId),
    queryFn: () => getInvitations(familyId),
    enabled: isAuthenticated && !!familyId,
    select: (data) => data.invitations,
  });
}

export function useSendInvitation(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InvitationData) => sendInvitation(familyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: familyKeys.invitations(familyId),
      });
    },
  });
}

export function useResendInvitation(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: number) =>
      resendInvitation(familyId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: familyKeys.invitations(familyId),
      });
    },
  });
}

export function useCancelInvitation(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: number) =>
      cancelInvitation(familyId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: familyKeys.invitations(familyId),
      });
    },
  });
}

// Membership queries and mutations
export function useMembers(familyId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: familyKeys.members(familyId),
    queryFn: () => getMembers(familyId),
    enabled: isAuthenticated && !!familyId,
    select: (data) => data.members,
  });
}

export function useUpdateMemberRole(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      membershipId,
      role,
    }: {
      membershipId: number;
      role: MemberRole;
    }) => updateMemberRole(familyId, membershipId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.members(familyId) });
    },
  });
}

export function useRemoveMember(familyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (membershipId: number) => removeMember(familyId, membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.members(familyId) });
    },
  });
}
