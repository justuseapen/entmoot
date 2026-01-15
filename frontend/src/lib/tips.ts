import { apiFetch } from "./api";

// Tip types matching backend
export const TIP_TYPES = [
  "goals_page",
  "first_reflection",
  "first_family_member",
  "first_daily_plan",
  "first_weekly_review",
] as const;

export type TipType = (typeof TIP_TYPES)[number];

export interface TipsData {
  tips_enabled: boolean;
  shown_tips: string[];
  available_tips: string[];
  pending_tips: string[];
}

export interface TipsResponse {
  tips: TipsData;
  already_shown?: boolean;
}

// Tip content configuration
export const TIP_CONTENT: Record<
  TipType,
  { title: string; message: string; icon?: string }
> = {
  goals_page: {
    title: "Pro tip",
    message:
      "Link daily goals to weekly goals to see how small wins add up to big achievements!",
    icon: "💡",
  },
  first_reflection: {
    title: "Reflection tip",
    message:
      "Reflection is the secret sauce—even 2 minutes makes a difference for personal growth.",
    icon: "✨",
  },
  first_family_member: {
    title: "Family tip",
    message:
      "Now you can share goals! Try creating a family goal together for maximum fun.",
    icon: "👨‍👩‍👧‍👦",
  },
  first_daily_plan: {
    title: "Planning tip",
    message:
      "Morning planning sets you up for success. Start with your top 3 priorities each day.",
    icon: "🌅",
  },
  first_weekly_review: {
    title: "Review tip",
    message:
      "Weekly reviews help you learn from patterns and adjust course. Make it a habit!",
    icon: "📊",
  },
};

// API functions
export async function getTips(): Promise<TipsResponse> {
  return apiFetch<TipsResponse>("/users/me/tips");
}

export async function markTipShown(tipType: TipType): Promise<TipsResponse> {
  return apiFetch<TipsResponse>("/users/me/tips/mark_shown", {
    method: "POST",
    body: JSON.stringify({ tip_type: tipType }),
  });
}

export async function toggleTips(enabled: boolean): Promise<TipsResponse> {
  return apiFetch<TipsResponse>("/users/me/tips/toggle", {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}

// Helper to check if a tip should be shown
export function shouldShowTip(
  tips: TipsData | undefined,
  tipType: TipType
): boolean {
  if (!tips) return false;
  return tips.tips_enabled && !tips.shown_tips.includes(tipType);
}
