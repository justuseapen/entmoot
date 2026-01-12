import { apiFetch } from "./api";

// Types
export interface TourPreferences {
  tour_completed_at: string | null;
  tour_dismissed_at: string | null;
  should_show_tour: boolean;
  can_restart_tour: boolean;
}

export interface TourPreferencesResponse {
  tour_preferences: TourPreferences;
  message?: string;
}

// API Functions
export async function getTourPreferences(): Promise<TourPreferencesResponse> {
  return apiFetch<TourPreferencesResponse>("/api/v1/users/me/tour_preferences");
}

export async function completeTour(): Promise<TourPreferencesResponse> {
  return apiFetch<TourPreferencesResponse>(
    "/api/v1/users/me/tour_preferences/complete",
    {
      method: "POST",
    }
  );
}

export async function dismissTour(): Promise<TourPreferencesResponse> {
  return apiFetch<TourPreferencesResponse>(
    "/api/v1/users/me/tour_preferences/dismiss",
    {
      method: "POST",
    }
  );
}

export async function restartTour(): Promise<TourPreferencesResponse> {
  return apiFetch<TourPreferencesResponse>(
    "/api/v1/users/me/tour_preferences/restart",
    {
      method: "POST",
    }
  );
}

// Tour step definitions
export const TOUR_STEPS = [
  {
    target: '[data-tour="dashboard"]',
    content:
      "Welcome to your Dashboard! This is your home base where you can see your daily plan, upcoming goals, streaks, and recent family activity at a glance.",
    title: "Dashboard",
    disableBeacon: true,
    placement: "bottom" as const,
  },
  {
    target: '[data-tour="goals"]',
    content:
      "Set SMART goals for yourself and your family. Link daily goals to weekly, monthly, quarterly, and annual goals to see how small wins add up to big achievements.",
    title: "Goal Creation",
    placement: "right" as const,
  },
  {
    target: '[data-tour="daily-planner"]',
    content:
      "Start each day with intention using the Daily Planner. Set your top 3 priorities, add tasks, and track your progress throughout the day.",
    title: "Daily Planning",
    placement: "right" as const,
  },
  {
    target: '[data-tour="family"]',
    content:
      "Invite family members to collaborate on goals and planning. Each member can have different roles: Admin, Adult, Teen, Child, or Observer.",
    title: "Family Members",
    placement: "right" as const,
  },
];
