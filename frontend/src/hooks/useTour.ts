import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTourPreferences,
  completeTour,
  dismissTour,
  restartTour,
} from "@/lib/tour";
import type { TourPreferencesResponse } from "@/lib/tour";

// Query keys
const TOUR_QUERY_KEY = ["tour", "preferences"];

// Get tour preferences
export function useTourPreferences() {
  return useQuery({
    queryKey: TOUR_QUERY_KEY,
    queryFn: getTourPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Complete tour mutation
export function useCompleteTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeTour,
    onSuccess: (data: TourPreferencesResponse) => {
      queryClient.setQueryData(TOUR_QUERY_KEY, data);
    },
  });
}

// Dismiss tour mutation (show me later)
export function useDismissTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissTour,
    onSuccess: (data: TourPreferencesResponse) => {
      queryClient.setQueryData(TOUR_QUERY_KEY, data);
    },
  });
}

// Restart tour mutation
export function useRestartTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restartTour,
    onSuccess: (data: TourPreferencesResponse) => {
      queryClient.setQueryData(TOUR_QUERY_KEY, data);
    },
  });
}
