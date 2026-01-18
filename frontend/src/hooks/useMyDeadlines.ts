import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { getMyDeadlines } from "@/lib/myDeadlines";
import type { MyDeadlinesResponse } from "@/lib/myDeadlines";

export const myDeadlinesKeys = {
  all: ["myDeadlines"] as const,
  list: (familyId: number) => [...myDeadlinesKeys.all, familyId] as const,
};

export function useMyDeadlines(familyId: number) {
  const { isAuthenticated } = useAuthStore();
  return useQuery<MyDeadlinesResponse>({
    queryKey: myDeadlinesKeys.list(familyId),
    queryFn: () => getMyDeadlines(familyId),
    enabled: isAuthenticated && !!familyId,
  });
}
