import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getReflectionPrompts,
  getReflections,
  getReflection,
  createReflection,
  updateReflection,
  deleteReflection,
  type ReflectionType,
  type CreateReflectionData,
  type UpdateReflectionData,
} from "@/lib/reflections";

// Query keys
export const reflectionKeys = {
  all: ["reflections"] as const,
  lists: () => [...reflectionKeys.all, "list"] as const,
  list: (
    familyId: number,
    filters?: { type?: ReflectionType; user_id?: number }
  ) => [...reflectionKeys.lists(), familyId, filters] as const,
  details: () => [...reflectionKeys.all, "detail"] as const,
  detail: (familyId: number, reflectionId: number) =>
    [...reflectionKeys.details(), familyId, reflectionId] as const,
  prompts: (type?: ReflectionType) =>
    [...reflectionKeys.all, "prompts", type] as const,
};

// Get reflection prompts
export function useReflectionPrompts(type?: ReflectionType) {
  return useQuery({
    queryKey: reflectionKeys.prompts(type),
    queryFn: () => getReflectionPrompts(type),
  });
}

// Get reflections list
export function useReflections(
  familyId: number,
  filters?: {
    type?: ReflectionType;
    user_id?: number;
    from?: string;
    to?: string;
  }
) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: reflectionKeys.list(familyId, filters),
    queryFn: () => getReflections(familyId, token!, filters),
    enabled: !!token && !!familyId,
  });
}

// Get a single reflection
export function useReflection(familyId: number, reflectionId: number) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: reflectionKeys.detail(familyId, reflectionId),
    queryFn: () => getReflection(familyId, reflectionId, token!),
    enabled: !!token && !!familyId && !!reflectionId,
  });
}

// Create a reflection
export function useCreateReflection(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      dailyPlanId,
    }: {
      data: CreateReflectionData;
      dailyPlanId?: number;
    }) => createReflection(familyId, data, token!, dailyPlanId),
    onSuccess: () => {
      // Invalidate reflections list
      queryClient.invalidateQueries({
        queryKey: reflectionKeys.lists(),
      });
    },
  });
}

// Update a reflection
export function useUpdateReflection(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reflectionId,
      data,
    }: {
      reflectionId: number;
      data: UpdateReflectionData;
    }) => updateReflection(familyId, reflectionId, data, token!),
    onSuccess: (response) => {
      // Update the cache with the new reflection data
      queryClient.setQueryData(
        reflectionKeys.detail(familyId, response.reflection.id),
        response.reflection
      );
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: reflectionKeys.lists(),
      });
    },
  });
}

// Delete a reflection
export function useDeleteReflection(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reflectionId: number) =>
      deleteReflection(familyId, reflectionId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reflectionKeys.lists(),
      });
    },
  });
}
