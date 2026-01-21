import { useMembers } from "@/hooks/useFamilies";
import { useFamilyStore } from "@/stores/family";

/**
 * Hook to get family members for the current family.
 * Useful for mention autocomplete and other family member lookups.
 */
export function useFamilyMembers() {
  const { currentFamily } = useFamilyStore();
  const familyId = currentFamily?.id ?? 0;
  const { data: members, isLoading, error } = useMembers(familyId);

  return {
    members: members ?? [],
    isLoading,
    error,
    familyId,
  };
}
