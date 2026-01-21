import { Users } from "lucide-react";

// Landing page design system colors
const LANDING_COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  sunsetOrange: "#FF7043",
  earthBrown: "#795548",
  darkForest: "#1B3A1A",
} as const;

interface SpotsCounterProps {
  totalSpots: number;
  remainingSpots: number;
  showIcon?: boolean;
  variant?: "default" | "compact" | "urgent";
}

export function SpotsCounter({
  totalSpots,
  remainingSpots,
  showIcon = true,
  variant = "default",
}: SpotsCounterProps) {
  const soldSpots = totalSpots - remainingSpots;
  const percentSold = (soldSpots / totalSpots) * 100;
  const isUrgent = remainingSpots < 50;

  // Color based on urgency
  const accentColor = isUrgent
    ? LANDING_COLORS.sunsetOrange
    : LANDING_COLORS.forestGreen;

  if (variant === "compact") {
    return (
      <span
        className="text-sm font-semibold"
        style={{
          color: isUrgent
            ? LANDING_COLORS.sunsetOrange
            : LANDING_COLORS.darkForest,
        }}
      >
        {remainingSpots} of {totalSpots} spots left
      </span>
    );
  }

  return (
    <div className="w-full">
      {/* Text display */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showIcon && (
            <Users className="h-4 w-4" style={{ color: accentColor }} />
          )}
          <span
            className="text-sm font-semibold"
            style={{ color: LANDING_COLORS.darkForest }}
          >
            {remainingSpots} of {totalSpots} Founding Family spots remaining
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-3 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: `${LANDING_COLORS.earthBrown}20` }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentSold}%`,
            backgroundColor: accentColor,
          }}
        />
      </div>

      {/* Urgency message */}
      {isUrgent && (
        <p
          className="mt-2 text-center text-xs font-medium"
          style={{ color: LANDING_COLORS.sunsetOrange }}
        >
          Almost sold out! Only {remainingSpots} spots remain.
        </p>
      )}
    </div>
  );
}
