import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Landing page design system colors
const LANDING_COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  creamWhite: "#FFF8E7",
  darkForest: "#1B3A1A",
  sunsetOrange: "#FF7043",
} as const;

interface StickyCtaBarProps {
  remainingSpots?: number;
  totalSpots?: number;
  showAfterScroll?: number; // Show after scrolling this many pixels
}

export function StickyCtaBar({
  remainingSpots = 453,
  totalSpots = 500,
  showAfterScroll = 600,
}: StickyCtaBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed
    const dismissed = sessionStorage.getItem("stickyCta_dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfterScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showAfterScroll]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("stickyCta_dismissed", "true");
  };

  if (isDismissed || !isVisible) {
    return null;
  }

  const isUrgent = remainingSpots < 50;

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-40 shadow-lg transition-transform duration-300"
      style={{
        backgroundColor: LANDING_COLORS.darkForest,
        transform: isVisible ? "translateY(0)" : "translateY(100%)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Left side - Message */}
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium sm:text-base"
            style={{
              color: isUrgent
                ? LANDING_COLORS.sunsetOrange
                : LANDING_COLORS.creamWhite,
            }}
          >
            {isUrgent ? (
              <>Only {remainingSpots} Founding Family Spots Left!</>
            ) : (
              <>
                {remainingSpots}/{totalSpots} Founding Family Spots Remaining
              </>
            )}
          </span>
        </div>

        {/* Right side - CTA and dismiss */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            size="sm"
            className="gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ backgroundColor: LANDING_COLORS.forestGreen }}
          >
            <Link to="/register?plan=lifetime">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">
                Get Lifetime Access -
              </span>{" "}
              $149
            </Link>
          </Button>

          <button
            onClick={handleDismiss}
            className="p-1 transition-opacity hover:opacity-70"
            style={{ color: LANDING_COLORS.creamWhite }}
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
