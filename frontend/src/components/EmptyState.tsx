import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Target,
  Moon,
  Users,
  Calendar,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

// Empty state variant configurations
export type EmptyStateVariant =
  | "goals"
  | "reflections"
  | "family_members"
  | "daily_plans"
  | "weekly_reviews"
  | "custom";

interface EmptyStateConfig {
  icon: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  actionLabel: string;
  iconColor: string;
  iconBgColor: string;
}

const EMPTY_STATE_CONFIG: Record<
  Exclude<EmptyStateVariant, "custom">,
  EmptyStateConfig
> = {
  goals: {
    icon: Target,
    emoji: "🎯",
    title: "No goals yet",
    description: "Your goals will appear here. Ready to set your first one?",
    actionLabel: "Create Goal",
    iconColor: "text-blue-600",
    iconBgColor: "bg-blue-100",
  },
  reflections: {
    icon: Moon,
    emoji: "🌙",
    title: "No reflections yet",
    description:
      "Reflections help you learn from each day. Start your first one tonight?",
    actionLabel: "Start Reflection",
    iconColor: "text-indigo-600",
    iconBgColor: "bg-indigo-100",
  },
  family_members: {
    icon: Users,
    emoji: "👨‍👩‍👧‍👦",
    title: "Just you for now",
    description: "Entmoot is better together. Invite your family!",
    actionLabel: "Invite Member",
    iconColor: "text-green-600",
    iconBgColor: "bg-green-100",
  },
  daily_plans: {
    icon: Calendar,
    emoji: "📅",
    title: "No daily plan yet",
    description:
      "Morning planning sets you up for success. Start your day with intention.",
    actionLabel: "Start Planning",
    iconColor: "text-amber-600",
    iconBgColor: "bg-amber-100",
  },
  weekly_reviews: {
    icon: ClipboardList,
    emoji: "📋",
    title: "No weekly reviews yet",
    description:
      "Weekly reviews help you see the bigger picture. Start your first review.",
    actionLabel: "Start Review",
    iconColor: "text-orange-600",
    iconBgColor: "bg-orange-100",
  },
};

interface EmptyStateProps {
  /** Pre-configured variant for common empty states */
  variant?: EmptyStateVariant;
  /** Custom icon component (overrides variant icon) */
  icon?: LucideIcon;
  /** Custom emoji (displayed alongside icon) */
  emoji?: string;
  /** Custom title (overrides variant title) */
  title?: string;
  /** Custom description (overrides variant description) */
  description?: string;
  /** Primary action button label (overrides variant label) */
  actionLabel?: string;
  /** Primary action click handler */
  onAction?: () => void;
  /** Secondary action button label */
  secondaryActionLabel?: string;
  /** Secondary action click handler */
  onSecondaryAction?: () => void;
  /** Whether to show the primary action button */
  showAction?: boolean;
  /** Custom icon color class (e.g., "text-blue-600") */
  iconColor?: string;
  /** Custom icon background color class (e.g., "bg-blue-100") */
  iconBgColor?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom content to render instead of default layout */
  children?: ReactNode;
}

export function EmptyState({
  variant = "custom",
  icon: customIcon,
  emoji: customEmoji,
  title: customTitle,
  description: customDescription,
  actionLabel: customActionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  showAction = true,
  iconColor: customIconColor,
  iconBgColor: customIconBgColor,
  className = "",
  children,
}: EmptyStateProps) {
  // Get config from variant or use defaults
  const config = variant !== "custom" ? EMPTY_STATE_CONFIG[variant] : null;

  const Icon = customIcon || config?.icon || Target;
  const emoji = customEmoji ?? config?.emoji;
  const title = customTitle || config?.title || "Nothing here yet";
  const description =
    customDescription || config?.description || "Get started by taking action.";
  const actionLabel = customActionLabel || config?.actionLabel || "Get Started";
  const iconColor = customIconColor || config?.iconColor || "text-gray-600";
  const iconBgColor = customIconBgColor || config?.iconBgColor || "bg-gray-100";

  // If custom children provided, render them instead
  if (children) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          {children}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {/* Icon with optional emoji */}
        <div className="mb-4 flex items-center gap-2">
          {emoji && <span className="text-3xl">{emoji}</span>}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBgColor}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>

        {/* Description */}
        <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
          {description}
        </p>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3">
          {showAction && onAction && (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Inline variant for use within existing cards (no Card wrapper)
interface InlineEmptyStateProps {
  /** Pre-configured variant */
  variant?: EmptyStateVariant;
  /** Custom emoji */
  emoji?: string;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Primary action */
  actionLabel?: string;
  /** Primary action handler */
  onAction?: () => void;
  /** Whether to show action */
  showAction?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function InlineEmptyState({
  variant = "custom",
  emoji: customEmoji,
  title: customTitle,
  description: customDescription,
  actionLabel: customActionLabel,
  onAction,
  showAction = true,
  className = "",
}: InlineEmptyStateProps) {
  const config = variant !== "custom" ? EMPTY_STATE_CONFIG[variant] : null;

  const emoji = customEmoji ?? config?.emoji;
  const title = customTitle || config?.title || "Nothing here yet";
  const description =
    customDescription || config?.description || "Get started by taking action.";
  const actionLabel = customActionLabel || config?.actionLabel || "Get Started";

  return (
    <div className={`py-8 text-center ${className}`}>
      {emoji && <div className="mb-3 text-4xl">{emoji}</div>}
      <p className="text-muted-foreground font-medium">{title}</p>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      {showAction && onAction && (
        <Button onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
