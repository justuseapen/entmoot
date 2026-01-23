import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

// ============================================================================
// Types
// ============================================================================

/** Role options for family members */
export type FamilyRole = "admin" | "adult" | "teen" | "child" | "observer";

/** A family from the API */
export interface Family {
  id: number;
  name: string;
  timezone: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  members?: FamilyMember[];
}

/** A family member from the API */
export interface FamilyMember {
  id: number; // membership id
  user_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role: FamilyRole;
  joined_at: string;
}

/** Invitation details */
export interface Invitation {
  id: number;
  email: string;
  role: FamilyRole;
  expires_at: string;
  created_at: string;
  inviter: {
    id: number;
    name: string;
  };
}

/** Payload for creating an invitation */
export interface CreateInvitationPayload {
  email: string;
  role: FamilyRole;
}

/** Response from invitation creation */
export interface InvitationResponse {
  message: string;
  invitation: Invitation;
}

/** Response from families list endpoint */
interface FamiliesResponse {
  families: Family[];
}

/** Response from family detail endpoint */
interface FamilyResponse {
  family: Family;
}

/** Response from members endpoint */
interface MembersResponse {
  members: FamilyMember[];
}

/** Response from invitations list endpoint */
interface InvitationsResponse {
  invitations: Invitation[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const familiesKeys = {
  all: ["families"] as const,
  list: () => [...familiesKeys.all, "list"] as const,
  detail: (familyId: number) => [...familiesKeys.all, "detail", familyId] as const,
  members: (familyId: number) => [...familiesKeys.all, "members", familyId] as const,
  invitations: (familyId: number) =>
    [...familiesKeys.all, "invitations", familyId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch all families the user belongs to.
 */
export function useFamilies() {
  return useQuery({
    queryKey: familiesKeys.list(),
    queryFn: async () => {
      const response = await api.get<FamiliesResponse>("/families");
      return response.families;
    },
  });
}

/**
 * Hook to fetch a single family with details.
 */
export function useFamily(familyId: number) {
  return useQuery({
    queryKey: familiesKeys.detail(familyId),
    queryFn: async () => {
      const response = await api.get<FamilyResponse>(`/families/${familyId}`);
      return response.family;
    },
    enabled: !!familyId,
  });
}

/**
 * Hook to fetch members of a specific family.
 */
export function useFamilyMembers(familyId: number | null) {
  return useQuery({
    queryKey: familiesKeys.members(familyId ?? 0),
    queryFn: async () => {
      if (!familyId) {
        throw new Error("No family selected");
      }
      const response = await api.get<MembersResponse>(
        `/families/${familyId}/members`
      );
      return response.members;
    },
    enabled: !!familyId,
  });
}

/**
 * Hook to fetch pending invitations for a family.
 */
export function useFamilyInvitations(familyId: number | null) {
  return useQuery({
    queryKey: familiesKeys.invitations(familyId ?? 0),
    queryFn: async () => {
      if (!familyId) {
        throw new Error("No family selected");
      }
      const response = await api.get<InvitationsResponse>(
        `/families/${familyId}/invitations`
      );
      return response.invitations;
    },
    enabled: !!familyId,
  });
}

/**
 * Hook to create a new invitation.
 */
export function useCreateInvitation() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async (payload: CreateInvitationPayload) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      return api.post<InvitationResponse>(
        `/families/${currentFamilyId}/invitations`,
        { invitation: payload }
      );
    },
    onSuccess: () => {
      if (currentFamilyId) {
        queryClient.invalidateQueries({
          queryKey: familiesKeys.invitations(currentFamilyId),
        });
      }
    },
  });
}

/**
 * Hook to cancel (delete) an invitation.
 */
export function useCancelInvitation() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async (invitationId: number) => {
      return api.del<{ message: string }>(`/invitations/${invitationId}`);
    },
    onSuccess: () => {
      if (currentFamilyId) {
        queryClient.invalidateQueries({
          queryKey: familiesKeys.invitations(currentFamilyId),
        });
      }
    },
  });
}

/**
 * Hook to resend an invitation.
 */
export function useResendInvitation() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async (invitationId: number) => {
      return api.post<InvitationResponse>(
        `/invitations/${invitationId}/resend`,
        {}
      );
    },
    onSuccess: () => {
      if (currentFamilyId) {
        queryClient.invalidateQueries({
          queryKey: familiesKeys.invitations(currentFamilyId),
        });
      }
    },
  });
}
