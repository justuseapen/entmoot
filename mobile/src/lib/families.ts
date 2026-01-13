import { authFetch } from "./api";
import type { Family, FamilyWithMembers } from "@shared/types";

// Family endpoints
export async function getFamilies(): Promise<{ families: Family[] }> {
  return authFetch<{ families: Family[] }>("/families");
}

export async function getFamily(
  id: number
): Promise<{ family: FamilyWithMembers }> {
  return authFetch<{ family: FamilyWithMembers }>(`/families/${id}`);
}

// Role display helpers
export const roleLabels: Record<string, string> = {
  admin: "Admin",
  adult: "Adult",
  teen: "Teen",
  child: "Child",
  observer: "Observer",
};
