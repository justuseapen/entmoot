import { Button } from "@/components/ui/button";
import { HERITAGE_COLORS, GRADIENTS } from "./design-system";
import {
  STRIPE_PAYMENT_LINK,
  PRICE_DISPLAY,
  REGULAR_PRICE_DISPLAY,
} from "@/config/pricing";

// Tree of Life decorative element - elegant botanical style
function TreeOfLifeDecoration({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        style={{ color: HERITAGE_COLORS.deepForest }}
      >
        {/* Outer circle */}
        <circle
          cx="100"
          cy="120"
          r="95"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.15"
        />
        {/* Inner decorative circle */}
        <circle
          cx="100"
          cy="120"
          r="85"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          opacity="0.1"
        />

        {/* Tree trunk */}
        <path
          d="M100 200 L100 140"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.2"
        />

        {/* Main branches - organic curves */}
        <path
          d="M100 140 Q70 120 50 80"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.15"
        />
        <path
          d="M100 140 Q130 120 150 80"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.15"
        />
        <path
          d="M100 140 L100 60"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.15"
        />

        {/* Secondary branches */}
        <path
          d="M70 100 Q55 85 45 60"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.1"
        />
        <path
          d="M130 100 Q145 85 155 60"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.1"
        />

        {/* Roots - mirrored below */}
        <path
          d="M100 200 Q70 210 50 230"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.1"
        />
        <path
          d="M100 200 Q130 210 150 230"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.1"
        />
      </svg>
    </div>
  );
}

// Decorative leaf/branch accent
function BranchAccent({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 40"
      fill="none"
      className={`${className} ${flip ? "scale-x-[-1]" : ""}`}
      style={{ color: HERITAGE_COLORS.sageGreen }}
      aria-hidden="true"
    >
      <path
        d="M10 20 Q40 10 60 20 Q80 30 110 20"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      {/* Small leaves along the branch */}
      <ellipse cx="30" cy="15" rx="8" ry="4" fill="currentColor" opacity="0.2" transform="rotate(-20 30 15)" />
      <ellipse cx="50" cy="18" rx="6" ry="3" fill="currentColor" opacity="0.15" transform="rotate(-10 50 18)" />
      <ellipse cx="70" cy="22" rx="8" ry="4" fill="currentColor" opacity="0.2" transform="rotate(10 70 22)" />
      <ellipse cx="90" cy="18" rx="6" ry="3" fill="currentColor" opacity="0.15" transform="rotate(20 90 18)" />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden pt-16">
      {/* Gradient background - soft parchment tones */}
      <div
        className="absolute inset-0"
        style={{ background: GRADIENTS.heroBackground }}
      />

      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231C4532' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Tree of Life background decoration - left */}
      <TreeOfLifeDecoration className="absolute -left-20 top-1/4 h-96 w-96 opacity-50 lg:opacity-70" />

      {/* Tree of Life background decoration - right */}
      <TreeOfLifeDecoration className="absolute -right-20 top-1/3 h-80 w-80 opacity-30 lg:opacity-50" />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex flex-1 flex-col items-center justify-center px-4 pb-24 text-center sm:px-6 lg:px-8">
        {/* Launch badge */}
        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium"
          style={{
            backgroundColor: `${HERITAGE_COLORS.deepForest}08`,
            borderColor: `${HERITAGE_COLORS.deepForest}20`,
            color: HERITAGE_COLORS.deepForest,
          }}
        >
          <span
            className="h-2 w-2 rounded-full animate-pulse"
            style={{ backgroundColor: HERITAGE_COLORS.antiqueGold }}
          />
          Founding Family Launch
        </div>

        {/* Decorative branch above headline */}
        <BranchAccent className="mb-4 h-8 w-32 opacity-60" />

        {/* Headline */}
        <h1
          className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          style={{
            color: HERITAGE_COLORS.charcoal,
            fontFamily: "'Georgia', serif",
          }}
        >
          Stop Managing Your Family.{" "}
          <br className="hidden sm:inline" />
          <span style={{ color: HERITAGE_COLORS.deepForest }}>
            Start Leading Them.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed sm:text-xl"
          style={{ color: HERITAGE_COLORS.sepia }}
        >
          Most families plan day-to-day. Yours will plan generation-to-generation.
          The only goal platform built for families first—connecting your child's
          daily tasks to your family's greatest dreams.
        </p>

        {/* Price badge */}
        <div
          className="mb-8 inline-flex items-center gap-3 rounded-lg border px-6 py-3"
          style={{
            backgroundColor: HERITAGE_COLORS.cream,
            borderColor: `${HERITAGE_COLORS.antiqueGold}40`,
          }}
        >
          <span
            className="text-sm font-medium line-through opacity-60"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            {REGULAR_PRICE_DISPLAY}
          </span>
          <span
            className="text-3xl font-bold sm:text-4xl"
            style={{ color: HERITAGE_COLORS.deepForest }}
          >
            {PRICE_DISPLAY}
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: HERITAGE_COLORS.antiqueGold }}
          >
            Lifetime
          </span>
        </div>

        {/* Single CTA button */}
        <Button
          asChild
          size="lg"
          className="gap-2 rounded-lg px-10 py-7 text-lg font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
          style={{ backgroundColor: HERITAGE_COLORS.deepForest }}
        >
          <a href={STRIPE_PAYMENT_LINK}>
            Claim Your Founding Family Spot
          </a>
        </Button>

        {/* Trust indicators */}
        <p
          className="mt-6 text-sm"
          style={{ color: HERITAGE_COLORS.sepia, opacity: 0.8 }}
        >
          One-time payment · Lifetime access · No subscriptions ever
        </p>

        {/* Decorative branch below CTA */}
        <BranchAccent className="mt-8 h-8 w-32 opacity-40" flip />
      </div>

      {/* Bottom decorative border - elegant line with medallion hint */}
      <div
        className="absolute right-0 bottom-0 left-0 h-24"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${HERITAGE_COLORS.parchment} 100%)`,
        }}
      >
        <div className="flex h-full items-end justify-center pb-4">
          <div
            className="h-px w-32 sm:w-48"
            style={{ backgroundColor: `${HERITAGE_COLORS.antiqueBrass}30` }}
          />
          <div
            className="mx-4 h-2 w-2 rotate-45"
            style={{ backgroundColor: `${HERITAGE_COLORS.antiqueBrass}40` }}
          />
          <div
            className="h-px w-32 sm:w-48"
            style={{ backgroundColor: `${HERITAGE_COLORS.antiqueBrass}30` }}
          />
        </div>
      </div>
    </section>
  );
}
