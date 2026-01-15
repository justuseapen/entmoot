import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const { headers, ...restOptions } = options || {};
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...restOptions,
    credentials: "include", // Include cookies for session auth
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Extract structured error data from backend response
    // Backend format: { error: string, errors?: string[], suggestion?: string }
    // Backward compatible: handles old format where error might just be a message string
    const message =
      errorData.error || errorData.message || `API error: ${response.status}`;
    const errors = Array.isArray(errorData.errors) ? errorData.errors : [];
    const suggestion = errorData.suggestion;

    throw new ApiError(message, response.status, errors, suggestion);
  }

  return response.json();
}
