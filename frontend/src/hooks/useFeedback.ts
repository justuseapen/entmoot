import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import {
  createFeedback,
  getFeedback,
  type CreateFeedbackData,
  type CreateFeedbackResponse,
  type GetFeedbackResponse,
} from "@/lib/feedback";

export function useCreateFeedback() {
  const { token } = useAuthStore();

  return useMutation<CreateFeedbackResponse, Error, CreateFeedbackData>({
    mutationFn: (data) => createFeedback(data, token ?? undefined),
  });
}

export function useGetFeedback(id: number | null) {
  const { token } = useAuthStore();

  return useQuery<GetFeedbackResponse, Error>({
    queryKey: ["feedback", id],
    queryFn: () => getFeedback(id!, token!),
    enabled: !!id && !!token,
  });
}

// Hook for keyboard shortcut: Cmd/Ctrl + Shift + F
export function useFeedbackShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key === "f"
      ) {
        event.preventDefault();
        onOpen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}
