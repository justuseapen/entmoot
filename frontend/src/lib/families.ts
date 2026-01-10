import { apiFetch } from "./api";

export type MemberRole = "observer" | "child" | "teen" | "adult" | "admin";

export interface Family {
  id: number;
  name: string;
  timezone: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role: MemberRole;
  joined_at: string;
}

export interface FamilyWithMembers extends Family {
  members: FamilyMember[];
}

export interface Invitation {
  id: number;
  email: string;
  role: MemberRole;
  expires_at: string;
  created_at: string;
  inviter: {
    id: number;
    name: string;
  };
}

export interface CreateFamilyData {
  name: string;
  timezone: string;
}

export interface UpdateFamilyData {
  name?: string;
  timezone?: string;
  settings?: Record<string, unknown>;
}

export interface InvitationData {
  email: string;
  role: MemberRole;
}

// Family endpoints
export async function getFamilies(
  token: string
): Promise<{ families: Family[] }> {
  return apiFetch<{ families: Family[] }>("/families", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getFamily(
  id: number,
  token: string
): Promise<{ family: FamilyWithMembers }> {
  return apiFetch<{ family: FamilyWithMembers }>(`/families/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createFamily(
  data: CreateFamilyData,
  token: string
): Promise<{ message: string; family: FamilyWithMembers }> {
  return apiFetch<{ message: string; family: FamilyWithMembers }>("/families", {
    method: "POST",
    body: JSON.stringify({ family: data }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateFamily(
  id: number,
  data: UpdateFamilyData,
  token: string
): Promise<{ message: string; family: FamilyWithMembers }> {
  return apiFetch<{ message: string; family: FamilyWithMembers }>(
    `/families/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ family: data }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function deleteFamily(
  id: number,
  token: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/families/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Invitation endpoints
export async function getInvitations(
  familyId: number,
  token: string
): Promise<{ invitations: Invitation[] }> {
  return apiFetch<{ invitations: Invitation[] }>(
    `/families/${familyId}/invitations`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function sendInvitation(
  familyId: number,
  data: InvitationData,
  token: string
): Promise<{ message: string; invitation: Invitation }> {
  return apiFetch<{ message: string; invitation: Invitation }>(
    `/families/${familyId}/invitations`,
    {
      method: "POST",
      body: JSON.stringify({ invitation: data }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function resendInvitation(
  familyId: number,
  invitationId: number,
  token: string
): Promise<{ message: string; invitation: Invitation }> {
  return apiFetch<{ message: string; invitation: Invitation }>(
    `/families/${familyId}/invitations/${invitationId}/resend`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function cancelInvitation(
  familyId: number,
  invitationId: number,
  token: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/families/${familyId}/invitations/${invitationId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export interface AcceptInvitationParams {
  inviteToken: string;
  authToken?: string;
  user?: {
    password: string;
    password_confirmation?: string;
    name?: string;
  };
}

export interface AcceptInvitationResponse {
  message: string;
  family: Family;
}

export interface InvitationRequiresAuthResponse {
  error: string;
  requires_auth: true;
  invitation: {
    email: string;
    family_name: string;
    role: MemberRole;
  };
}

export async function acceptInvitation(
  params: AcceptInvitationParams
): Promise<AcceptInvitationResponse> {
  const headers: Record<string, string> = {};
  if (params.authToken) {
    headers.Authorization = `Bearer ${params.authToken}`;
  }

  return apiFetch<AcceptInvitationResponse>(
    `/invitations/${params.inviteToken}/accept`,
    {
      method: "POST",
      headers,
      body: params.user ? JSON.stringify({ user: params.user }) : undefined,
    }
  );
}

export async function getInvitationDetails(
  inviteToken: string,
  authToken?: string
): Promise<AcceptInvitationResponse | InvitationRequiresAuthResponse> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  // Try to accept - if user is logged in, it will succeed
  // If not, we'll get requires_auth: true with invitation details
  const response = await fetch(`/api/v1/invitations/${inviteToken}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  return response.json();
}

// Membership endpoints
export async function getMembers(
  familyId: number,
  token: string
): Promise<{ members: FamilyMember[] }> {
  return apiFetch<{ members: FamilyMember[] }>(
    `/families/${familyId}/memberships`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function updateMemberRole(
  familyId: number,
  membershipId: number,
  role: MemberRole,
  token: string
): Promise<{ message: string; member: FamilyMember }> {
  return apiFetch<{ message: string; member: FamilyMember }>(
    `/families/${familyId}/memberships/${membershipId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ membership: { role } }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function removeMember(
  familyId: number,
  membershipId: number,
  token: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/families/${familyId}/memberships/${membershipId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

// Utility function to get browser timezone
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Role display helpers
export const roleLabels: Record<MemberRole, string> = {
  admin: "Admin",
  adult: "Adult",
  teen: "Teen",
  child: "Child",
  observer: "Observer",
};

export const roleDescriptions: Record<MemberRole, string> = {
  admin: "Full access to all settings and members",
  adult: "Can manage goals and invite members",
  teen: "Limited access to family features",
  child: "Basic access to their own tasks",
  observer: "Read-only access to family content",
};
