import { apiFetch } from "./api";

export interface Pet {
  id: number;
  name: string;
  pet_type: string | null;
  avatar_url: string | null;
  birthday: string | null;
  notes: string | null;
  family_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePetData {
  name: string;
  pet_type?: string;
  avatar_url?: string;
  birthday?: string;
  notes?: string;
}

export interface UpdatePetData {
  name?: string;
  pet_type?: string;
  avatar_url?: string;
  birthday?: string;
  notes?: string;
}

// Pet endpoints
export async function getPets(
  familyId: number,
  token: string
): Promise<{ pets: Pet[] }> {
  return apiFetch<{ pets: Pet[] }>(`/families/${familyId}/pets`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getPet(
  familyId: number,
  petId: number,
  token: string
): Promise<{ pet: Pet }> {
  return apiFetch<{ pet: Pet }>(`/families/${familyId}/pets/${petId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createPet(
  familyId: number,
  data: CreatePetData,
  token: string
): Promise<{ message: string; pet: Pet }> {
  return apiFetch<{ message: string; pet: Pet }>(`/families/${familyId}/pets`, {
    method: "POST",
    body: JSON.stringify({ pet: data }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updatePet(
  familyId: number,
  petId: number,
  data: UpdatePetData,
  token: string
): Promise<{ message: string; pet: Pet }> {
  return apiFetch<{ message: string; pet: Pet }>(
    `/families/${familyId}/pets/${petId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ pet: data }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function deletePet(
  familyId: number,
  petId: number,
  token: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/families/${familyId}/pets/${petId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Pet type emoji mapping for fallback avatars
export const petTypeEmojis: Record<string, string> = {
  dog: "🐕",
  cat: "🐈",
  bird: "🐦",
  fish: "🐠",
  hamster: "🐹",
  rabbit: "🐇",
  turtle: "🐢",
  snake: "🐍",
  lizard: "🦎",
  frog: "🐸",
  guinea_pig: "🐹",
  ferret: "🦨",
  horse: "🐴",
  chicken: "🐔",
  duck: "🦆",
  parrot: "🦜",
  mouse: "🐭",
  rat: "🐀",
};

export function getPetEmoji(petType: string | null | undefined): string {
  if (!petType) return "🐾";
  const normalizedType = petType.toLowerCase().replace(/\s+/g, "_");
  return petTypeEmojis[normalizedType] || "🐾";
}

// Common pet types for selection
export const commonPetTypes = [
  "Dog",
  "Cat",
  "Bird",
  "Fish",
  "Hamster",
  "Rabbit",
  "Turtle",
  "Snake",
  "Lizard",
  "Guinea Pig",
  "Ferret",
  "Horse",
  "Chicken",
  "Duck",
  "Parrot",
  "Mouse",
  "Other",
];
