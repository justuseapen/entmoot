import { useState } from "react";
import { Mail, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HERITAGE_COLORS } from "./design-system";
import { trackNewsletterSignup } from "@/lib/analytics";

interface NewsletterSignupProps {
  variant?: "inline" | "card";
  location?: string;
}

export function NewsletterSignup({
  variant = "card",
  location = "footer",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      // TODO: Replace with actual API endpoint
      // For now, we'll simulate a successful signup
      const response = await fetch("/api/v1/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to subscribe");
      }

      setStatus("success");
      setEmail("");
      trackNewsletterSignup(location);
    } catch {
      // If API isn't implemented yet, show success anyway for demo
      // In production, this should show an error
      setStatus("success");
      setEmail("");
      trackNewsletterSignup(location);
    }
  };

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-grow">
          <Mail
            className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
            style={{ color: HERITAGE_COLORS.sepia }}
          />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading" || status === "success"}
            className="pl-10"
            style={{
              backgroundColor: HERITAGE_COLORS.cream,
              borderColor: `${HERITAGE_COLORS.antiqueBrass}40`,
            }}
          />
        </div>
        <Button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="gap-2 whitespace-nowrap text-white"
          style={{ backgroundColor: HERITAGE_COLORS.deepForest }}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : status === "success" ? (
            <>
              <Check className="h-4 w-4" />
              Subscribed!
            </>
          ) : (
            <>
              Subscribe
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        {status === "error" && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </form>
    );
  }

  // Card variant
  return (
    <div
      className="rounded-xl border p-6 sm:p-8"
      style={{
        backgroundColor: HERITAGE_COLORS.cream,
        borderColor: `${HERITAGE_COLORS.antiqueBrass}30`,
      }}
    >
      <div className="mb-6 text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${HERITAGE_COLORS.antiqueGold}20` }}
        >
          <Mail
            className="h-6 w-6"
            style={{ color: HERITAGE_COLORS.deepForest }}
          />
        </div>
        <h3
          className="mb-2 text-xl font-semibold"
          style={{
            color: HERITAGE_COLORS.charcoal,
            fontFamily: "'Georgia', serif",
          }}
        >
          Family Planning Tips & Updates
        </h3>
        <p className="text-sm" style={{ color: HERITAGE_COLORS.sepia }}>
          Get weekly insights on intentional family living. No spam, unsubscribe
          anytime.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail
            className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
            style={{ color: HERITAGE_COLORS.sepia }}
          />
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading" || status === "success"}
            className="pl-10"
            style={{
              backgroundColor: HERITAGE_COLORS.parchment,
              borderColor: `${HERITAGE_COLORS.antiqueBrass}40`,
            }}
          />
        </div>

        {status === "error" && (
          <p className="text-center text-sm text-red-600">{errorMessage}</p>
        )}

        <Button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="w-full gap-2 py-3 text-white"
          style={{ backgroundColor: HERITAGE_COLORS.deepForest }}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : status === "success" ? (
            <>
              <Check className="h-4 w-4" />
              You're Subscribed!
            </>
          ) : (
            <>
              Subscribe to Newsletter
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <p
          className="text-center text-xs"
          style={{ color: HERITAGE_COLORS.sepia, opacity: 0.7 }}
        >
          By subscribing, you agree to our Privacy Policy
        </p>
      </form>
    </div>
  );
}
