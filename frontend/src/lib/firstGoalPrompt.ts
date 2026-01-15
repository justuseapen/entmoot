import { apiFetch } from "./api";
import type { TimeScale } from "./goals";

export interface GoalSuggestion {
  title: string;
  description: string;
  time_scale: TimeScale;
}

export interface FirstGoalPromptStatus {
  should_show: boolean;
  first_goal_created_at: string | null;
  dismissed_at: string | null;
  suggestions: GoalSuggestion[];
}

export async function getFirstGoalPromptStatus(): Promise<FirstGoalPromptStatus> {
  return apiFetch<FirstGoalPromptStatus>("/users/me/first_goal_prompt");
}

export async function dismissFirstGoalPrompt(): Promise<{
  dismissed: boolean;
}> {
  return apiFetch<{ dismissed: boolean }>(
    "/users/me/first_goal_prompt/dismiss",
    {
      method: "POST",
    }
  );
}

export async function getGoalSuggestions(): Promise<{
  suggestions: GoalSuggestion[];
}> {
  return apiFetch<{ suggestions: GoalSuggestion[] }>(
    "/users/me/first_goal_prompt/suggestions"
  );
}
