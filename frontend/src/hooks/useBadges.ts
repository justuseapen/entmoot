import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  getAllBadges,
  getUserBadges,
  type AllBadgesResponse,
  type UserBadgesResponse,
} from "@/lib/badges";

// Query keys
export const badgesKeys = {
  all: ["badges"] as const,
  allBadges: () => [...badgesKeys.all, "all"] as const,
  userBadges: () => [...badgesKeys.all, "user"] as const,
};

// Get all available badges
export function useAllBadges() {
  const { token } = useAuthStore();
  return useQuery<AllBadgesResponse>({
    queryKey: badgesKeys.allBadges(),
    queryFn: () => getAllBadges(token!),
    enabled: !!token,
    staleTime: 300000, // Cache for 5 minutes (badges don't change often)
  });
}

// Get user's badges with earned status
export function useUserBadges() {
  const { token } = useAuthStore();
  return useQuery<UserBadgesResponse>({
    queryKey: badgesKeys.userBadges(),
    queryFn: () => getUserBadges(token!),
    enabled: !!token,
    staleTime: 60000, // Cache for 1 minute
  });
}
