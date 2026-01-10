import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
  type CreatePetData,
  type UpdatePetData,
} from "@/lib/pets";

// Query keys
export const petKeys = {
  all: ["pets"] as const,
  lists: () => [...petKeys.all, "list"] as const,
  list: (familyId: number) => [...petKeys.lists(), familyId] as const,
  details: () => [...petKeys.all, "detail"] as const,
  detail: (familyId: number, petId: number) =>
    [...petKeys.details(), familyId, petId] as const,
};

// Pet queries
export function usePets(familyId: number) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: petKeys.list(familyId),
    queryFn: () => getPets(familyId, token!),
    enabled: !!token && !!familyId,
    select: (data) => data.pets,
  });
}

export function usePet(familyId: number, petId: number) {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: petKeys.detail(familyId, petId),
    queryFn: () => getPet(familyId, petId, token!),
    enabled: !!token && !!familyId && !!petId,
    select: (data) => data.pet,
  });
}

// Pet mutations
export function useCreatePet(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePetData) => createPet(familyId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petKeys.list(familyId) });
    },
  });
}

export function useUpdatePet(familyId: number, petId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePetData) =>
      updatePet(familyId, petId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petKeys.list(familyId) });
      queryClient.invalidateQueries({
        queryKey: petKeys.detail(familyId, petId),
      });
    },
  });
}

export function useDeletePet(familyId: number) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (petId: number) => deletePet(familyId, petId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petKeys.list(familyId) });
    },
  });
}
