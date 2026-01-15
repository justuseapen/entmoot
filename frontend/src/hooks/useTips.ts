import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import type { TipType } from "@/lib/tips";
import { getTips, markTipShown, toggleTips, shouldShowTip } from "@/lib/tips";

// Query keys
export const tipsKeys = {
  all: ["tips"] as const,
  detail: () => [...tipsKeys.all, "detail"] as const,
};

export function useTips() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: tipsKeys.detail(),
    queryFn: () => getTips(),
    enabled: isAuthenticated,
  });
}

export function useMarkTipShown() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tipType: TipType) => markTipShown(tipType),
    onSuccess: (data) => {
      queryClient.setQueryData(tipsKeys.detail(), data);
    },
  });
}

export function useToggleTips() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enabled: boolean) => toggleTips(enabled),
    onSuccess: (data) => {
      queryClient.setQueryData(tipsKeys.detail(), data);
    },
  });
}

// Helper hook to check if a specific tip should be shown
export function useShouldShowTip(tipType: TipType): boolean {
  const { data } = useTips();
  return shouldShowTip(data?.tips, tipType);
}

// Hook to use a tip - returns show state and dismiss function
export function useTip(tipType: TipType) {
  const { data, isLoading } = useTips();
  const { mutate: dismiss } = useMarkTipShown();

  const shouldShow = shouldShowTip(data?.tips, tipType);

  const dismissTip = () => {
    dismiss(tipType);
  };

  return {
    shouldShow,
    dismissTip,
    isLoading,
    tipsEnabled: data?.tips?.tips_enabled ?? true,
  };
}
