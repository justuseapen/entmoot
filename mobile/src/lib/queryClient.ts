import { QueryClient } from "@tanstack/react-query";

/**
 * Default options for TanStack Query
 * - staleTime: 5 minutes - data is fresh for 5 minutes
 * - gcTime: 30 minutes - unused data is garbage collected after 30 minutes
 * - retry: 2 - retry failed requests twice before giving up
 * - refetchOnWindowFocus: false - don't refetch when app comes to foreground (mobile UX)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default queryClient;
