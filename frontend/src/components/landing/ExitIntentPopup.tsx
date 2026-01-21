import { useState, useEffect, useCallback } from "react";
import { X, Gift, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Landing page design system colors
const LANDING_COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  creamWhite: "#FFF8E7",
  darkForest: "#1B3A1A",
  earthBrown: "#795548",
  warmGold: "#FFD54F",
} as const;

interface ExitIntentPopupProps {
  discountCode?: string;
  discountAmount?: number;
  onEmailSubmit?: (email: string) => void;
}

export function ExitIntentPopup({
  discountCode = "FOUNDING20",
  discountAmount = 20,
  onEmailSubmit,
}: ExitIntentPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      // Only trigger when mouse leaves from the top of the page
      if (e.clientY <= 0 && !hasTriggered) {
        // Check if user has already seen and dismissed the popup
        const dismissed = localStorage.getItem("exitIntent_dismissed");
        if (!dismissed) {
          setIsVisible(true);
          setHasTriggered(true);
        }
      }
    },
    [hasTriggered]
  );

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem("exitIntent_dismissed");
    if (dismissed) {
      return;
    }

    // Add exit intent listener
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("exitIntent_dismissed", "true");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onEmailSubmit?.(email);
      setIsSubmitted(true);
      // Store in localStorage to prevent showing again
      localStorage.setItem("exitIntent_submitted", email);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Popup */}
      <div
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl p-8 shadow-2xl"
        style={{ backgroundColor: LANDING_COLORS.creamWhite }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 transition-opacity hover:opacity-70"
          style={{ color: LANDING_COLORS.earthBrown }}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {!isSubmitted ? (
          <>
            {/* Gift icon */}
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: `${LANDING_COLORS.warmGold}30` }}
            >
              <Gift
                className="h-8 w-8"
                style={{ color: LANDING_COLORS.forestGreen }}
              />
            </div>

            {/* Heading */}
            <h3
              className="mb-2 text-center text-2xl font-bold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Wait! Don't leave empty-handed
            </h3>

            {/* Subheading */}
            <p
              className="mb-6 text-center"
              style={{ color: LANDING_COLORS.earthBrown }}
            >
              Get our free <strong>Family Goal Template Pack</strong> plus{" "}
              <span
                className="font-bold"
                style={{ color: LANDING_COLORS.forestGreen }}
              >
                ${discountAmount} off
              </span>{" "}
              your Founding Family membership.
            </p>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail
                  className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
                  style={{ color: LANDING_COLORS.earthBrown }}
                />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 pl-10"
                  style={{
                    borderColor: LANDING_COLORS.leafGreen,
                  }}
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full text-base font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: LANDING_COLORS.forestGreen }}
              >
                Send Me the Templates & Discount
              </Button>
            </form>

            {/* Trust text */}
            <p
              className="mt-4 text-center text-xs"
              style={{ color: LANDING_COLORS.earthBrown }}
            >
              No spam, ever. Unsubscribe anytime.
            </p>
          </>
        ) : (
          /* Success state */
          <>
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: `${LANDING_COLORS.leafGreen}30` }}
            >
              <Gift
                className="h-8 w-8"
                style={{ color: LANDING_COLORS.forestGreen }}
              />
            </div>

            <h3
              className="mb-2 text-center text-2xl font-bold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Check your inbox!
            </h3>

            <p
              className="mb-6 text-center"
              style={{ color: LANDING_COLORS.earthBrown }}
            >
              We've sent the Family Goal Template Pack to{" "}
              <strong>{email}</strong>. Your discount code is:
            </p>

            {/* Discount code display */}
            <div
              className="mb-6 rounded-lg py-4 text-center"
              style={{ backgroundColor: `${LANDING_COLORS.forestGreen}15` }}
            >
              <span
                className="font-mono text-2xl font-bold tracking-wider"
                style={{ color: LANDING_COLORS.forestGreen }}
              >
                {discountCode}
              </span>
            </div>

            <Button
              onClick={handleDismiss}
              className="w-full text-base font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: LANDING_COLORS.forestGreen }}
            >
              Continue to Entmoot
            </Button>
          </>
        )}
      </div>
    </>
  );
}
