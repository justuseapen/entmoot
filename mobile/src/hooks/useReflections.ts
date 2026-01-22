import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

// ============================================================================
// Types
// ============================================================================

/** Reflection type enum matching backend */
export type ReflectionType =
  | "evening"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "quick";

/** Mood options matching backend enum */
export type ReflectionMood = "great" | "good" | "okay" | "difficult" | "rough";

/** User summary for reflection author */
export interface ReflectionUser {
  id: number;
  name: string;
  email: string;
}

/** A single reflection response (prompt/response pair) */
export interface ReflectionResponse {
  id: number;
  prompt: string;
  response: string | null;
}

/** A reflection from the API */
export interface Reflection {
  id: number;
  daily_plan_id: number;
  reflection_type: ReflectionType;
  mood: ReflectionMood | null;
  energy_level: number | null;
  gratitude_items: string[] | null;
  completed: boolean;
  date: string;
  user: ReflectionUser;
  reflection_responses: ReflectionResponse[];
  created_at: string;
  updated_at: string;
}

/** Filters for fetching reflections */
export interface ReflectionFilters {
  type?: ReflectionType;
  user_id?: number;
  from?: string; // ISO date string
  to?: string; // ISO date string
}

/** Reflection response attributes for nested create/update */
export interface ReflectionResponseAttributes {
  id?: number;
  prompt: string;
  response: string | null;
  _destroy?: boolean;
}

/** Payload for creating a reflection */
export interface CreateReflectionPayload {
  reflection_type: ReflectionType;
  mood?: ReflectionMood;
  energy_level?: number;
  gratitude_items?: string[];
  daily_plan_id?: number;
  reflection_responses_attributes?: ReflectionResponseAttributes[];
}

/** Payload for updating a reflection */
export interface UpdateReflectionPayload {
  mood?: ReflectionMood;
  energy_level?: number;
  gratitude_items?: string[];
  reflection_responses_attributes?: ReflectionResponseAttributes[];
}

/** Response from create/update reflection endpoints */
export interface ReflectionMutationResponse {
  message: string;
  reflection: Reflection;
  is_first_action?: boolean;
}

// ============================================================================
// Query Keys
// ============================================================================

export const reflectionsKeys = {
  all: ["reflections"] as const,
  list: (familyId: number, filters?: ReflectionFilters) =>
    [...reflectionsKeys.all, "list", familyId, filters] as const,
  detail: (familyId: number, reflectionId: number) =>
    [...reflectionsKeys.all, "detail", familyId, reflectionId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch reflections for the current family.
 * Accepts optional filters to filter by type, user_id, from, and to dates.
 */
export function useReflections(filters?: ReflectionFilters) {
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useQuery({
    queryKey: reflectionsKeys.list(currentFamilyId ?? 0, filters),
    queryFn: async () => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }

      // Build query params from filters
      const params = new URLSearchParams();
      if (filters?.type) {
        params.append("type", filters.type);
      }
      if (filters?.user_id) {
        params.append("user_id", filters.user_id.toString());
      }
      if (filters?.from) {
        params.append("from", filters.from);
      }
      if (filters?.to) {
        params.append("to", filters.to);
      }

      const queryString = params.toString();
      const url = `/families/${currentFamilyId}/reflections${queryString ? `?${queryString}` : ""}`;

      const response = await api.get<{ reflections: Reflection[] }>(url);
      return response.reflections;
    },
    enabled: !!currentFamilyId,
  });
}

/**
 * Hook to fetch a single reflection by ID.
 */
export function useReflection(reflectionId: number) {
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useQuery({
    queryKey: reflectionsKeys.detail(currentFamilyId ?? 0, reflectionId),
    queryFn: async () => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      const response = await api.get<Reflection>(
        `/families/${currentFamilyId}/reflections/${reflectionId}`
      );
      return response;
    },
    enabled: !!currentFamilyId && !!reflectionId,
  });
}

/**
 * Hook to create a new reflection.
 * Invalidates the reflections list query on success.
 */
export function useCreateReflection() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async (payload: CreateReflectionPayload) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      return api.post<ReflectionMutationResponse>(
        `/families/${currentFamilyId}/reflections`,
        { reflection: payload }
      );
    },
    onSuccess: () => {
      // Invalidate all reflection lists to refresh with new reflection
      queryClient.invalidateQueries({ queryKey: reflectionsKeys.all });
    },
  });
}

/**
 * Hook to update an existing reflection.
 * Invalidates relevant queries on success.
 */
export function useUpdateReflection() {
  const queryClient = useQueryClient();
  const currentFamilyId = useAuthStore((state) => state.currentFamilyId);

  return useMutation({
    mutationFn: async ({
      reflectionId,
      payload,
    }: {
      reflectionId: number;
      payload: UpdateReflectionPayload;
    }) => {
      if (!currentFamilyId) {
        throw new Error("No family selected");
      }
      return api.patch<ReflectionMutationResponse>(
        `/families/${currentFamilyId}/reflections/${reflectionId}`,
        { reflection: payload }
      );
    },
    onSuccess: (data, variables) => {
      // Update the reflection detail in cache
      if (currentFamilyId) {
        queryClient.setQueryData(
          reflectionsKeys.detail(currentFamilyId, variables.reflectionId),
          data.reflection
        );
      }
      // Invalidate all reflection lists to reflect changes
      queryClient.invalidateQueries({ queryKey: reflectionsKeys.all });
    },
  });
}
