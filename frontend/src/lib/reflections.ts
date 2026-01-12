import { apiFetch } from "./api";

// Reflection type enum values
export type ReflectionType =
  | "evening"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual";

// Mood enum values
export type Mood = "great" | "good" | "okay" | "difficult" | "rough";

// Reflection prompt from backend
export interface ReflectionPrompt {
  key: string;
  prompt: string;
  description: string;
}

// Reflection response (answer to a prompt)
export interface ReflectionResponse {
  id?: number;
  prompt: string;
  response: string;
  _destroy?: boolean;
}

// User summary in reflection
export interface ReflectionUser {
  id: number;
  name: string;
  email: string;
}

// Reflection type
export interface Reflection {
  id: number;
  daily_plan_id: number;
  reflection_type: ReflectionType;
  mood: Mood | null;
  energy_level: number | null;
  gratitude_items: string[];
  completed: boolean;
  date: string;
  user: ReflectionUser;
  reflection_responses: ReflectionResponse[];
  created_at: string;
  updated_at: string;
}

// Create reflection data
export interface CreateReflectionData {
  reflection_type: ReflectionType;
  mood?: Mood | null;
  energy_level?: number | null;
  gratitude_items?: string[];
  reflection_responses_attributes?: ReflectionResponseAttributes[];
}

// Update reflection data
export interface UpdateReflectionData {
  mood?: Mood | null;
  energy_level?: number | null;
  gratitude_items?: string[];
  reflection_responses_attributes?: ReflectionResponseAttributes[];
}

// Reflection response attributes for create/update
export interface ReflectionResponseAttributes {
  id?: number;
  prompt: string;
  response: string;
  _destroy?: boolean;
}

// Mood display mapping with emoji
export const MOOD_CONFIG: Record<
  Mood,
  { label: string; emoji: string; color: string }
> = {
  great: { label: "Great", emoji: "🌟", color: "text-yellow-500" },
  good: { label: "Good", emoji: "😊", color: "text-green-500" },
  okay: { label: "Okay", emoji: "😐", color: "text-blue-500" },
  difficult: { label: "Difficult", emoji: "😓", color: "text-orange-500" },
  rough: { label: "Rough", emoji: "😔", color: "text-red-500" },
};

// All moods in order
export const MOODS: Mood[] = ["great", "good", "okay", "difficult", "rough"];

// Energy level labels
export const ENERGY_LABELS: Record<number, string> = {
  1: "Very Low",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Very High",
};

// API functions

// Get reflection prompts
export async function getReflectionPrompts(type?: ReflectionType): Promise<{
  prompts: ReflectionPrompt[] | Record<string, ReflectionPrompt[]>;
}> {
  const url = type ? `/reflection_prompts?type=${type}` : `/reflection_prompts`;
  return apiFetch(url);
}

// Get reflections for a family
export async function getReflections(
  familyId: number,
  token: string,
  filters?: {
    type?: ReflectionType;
    user_id?: number;
    from?: string;
    to?: string;
  }
): Promise<{ reflections: Reflection[] }> {
  const params = new URLSearchParams();
  if (filters?.type) params.append("type", filters.type);
  if (filters?.user_id) params.append("user_id", filters.user_id.toString());
  if (filters?.from) params.append("from", filters.from);
  if (filters?.to) params.append("to", filters.to);

  const queryString = params.toString();
  const url = `/families/${familyId}/reflections${queryString ? `?${queryString}` : ""}`;

  return apiFetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Get a single reflection
export async function getReflection(
  familyId: number,
  reflectionId: number,
  token: string
): Promise<Reflection> {
  return apiFetch(`/families/${familyId}/reflections/${reflectionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Create a reflection
export async function createReflection(
  familyId: number,
  data: CreateReflectionData,
  token: string,
  dailyPlanId?: number
): Promise<{
  message: string;
  reflection: Reflection;
  is_first_action: boolean;
}> {
  const url = dailyPlanId
    ? `/families/${familyId}/reflections?daily_plan_id=${dailyPlanId}`
    : `/families/${familyId}/reflections`;

  return apiFetch(url, {
    method: "POST",
    body: JSON.stringify({ reflection: data }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Update a reflection
export async function updateReflection(
  familyId: number,
  reflectionId: number,
  data: UpdateReflectionData,
  token: string
): Promise<{
  message: string;
  reflection: Reflection;
  is_first_action: boolean;
}> {
  return apiFetch(`/families/${familyId}/reflections/${reflectionId}`, {
    method: "PATCH",
    body: JSON.stringify({ reflection: data }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Delete a reflection
export async function deleteReflection(
  familyId: number,
  reflectionId: number,
  token: string
): Promise<{ message: string }> {
  return apiFetch(`/families/${familyId}/reflections/${reflectionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Helper to format date for display
export function formatReflectionDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Helper to check if reflection is from today
export function isReflectionFromToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
