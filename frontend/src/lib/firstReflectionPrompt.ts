import { apiFetch } from "./api";

export type TimePeriod = "morning" | "afternoon" | "evening" | null;

export interface ReflectionPrompt {
  question: string;
  placeholder: string;
}

export interface FirstReflectionPromptStatus {
  should_show: boolean;
  first_reflection_created_at: string | null;
  dismissed_at: string | null;
  time_period: TimePeriod;
  prompt: ReflectionPrompt | null;
}

export interface QuickReflectionResponse {
  id: number;
  reflection_type: string;
  created_at: string;
  response: string;
  prompt: string;
}

export async function getFirstReflectionPromptStatus(
  token: string
): Promise<FirstReflectionPromptStatus> {
  return apiFetch<FirstReflectionPromptStatus>(
    "/users/me/first_reflection_prompt",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function dismissFirstReflectionPrompt(
  token: string
): Promise<{ dismissed: boolean }> {
  return apiFetch<{ dismissed: boolean }>(
    "/users/me/first_reflection_prompt/dismiss",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function submitQuickReflection(
  token: string,
  response: string,
  familyId?: number
): Promise<QuickReflectionResponse> {
  const params: Record<string, unknown> = { response };
  if (familyId) {
    params.family_id = familyId;
  }

  return apiFetch<QuickReflectionResponse>(
    "/users/me/first_reflection_prompt",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );
}

// Helper to get emoji for time period
export function getTimePeriodEmoji(timePeriod: TimePeriod): string {
  switch (timePeriod) {
    case "morning":
      return "\u2600\ufe0f"; // sun
    case "afternoon":
      return "\ud83c\udf24\ufe0f"; // sun behind cloud
    case "evening":
      return "\ud83c\udf19"; // crescent moon
    default:
      return "\ud83d\udcad"; // thought bubble
  }
}

// Helper to get greeting for time period
export function getTimePeriodGreeting(timePeriod: TimePeriod): string {
  switch (timePeriod) {
    case "morning":
      return "Good morning!";
    case "afternoon":
      return "Good afternoon!";
    case "evening":
      return "Good evening!";
    default:
      return "Hello!";
  }
}
