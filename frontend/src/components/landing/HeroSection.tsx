import { Link } from "react-router-dom";
import { Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/useScrollAnimation";
import { SpotsCounter } from "./SpotsCounter";

// Landing page design system colors
const LANDING_COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  skyBlue: "#64B5F6",
  warmGold: "#FFD54F",
  earthBrown: "#795548",
  creamWhite: "#FFF8E7",
  sunsetOrange: "#FF7043",
  darkForest: "#1B3A1A",
} as const;

// Blocky tree SVG component for the forest silhouette
function BlockyTree({
  height,
  className = "",
}: {
  height: number;
  className?: string;
}) {
  const width = height * 0.6;
  const trunkWidth = width * 0.2;
  const trunkHeight = height * 0.25;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ color: LANDING_COLORS.darkForest }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Tree crown - blocky/pixelated style with stacked rectangles */}
      <rect
        x={width * 0.2}
        y={0}
        width={width * 0.6}
        height={height * 0.25}
        fill="currentColor"
      />
      <rect
        x={width * 0.1}
        y={height * 0.2}
        width={width * 0.8}
        height={height * 0.25}
        fill="currentColor"
      />
      <rect
        x={0}
        y={height * 0.4}
        width={width}
        height={height * 0.25}
        fill="currentColor"
      />
      {/* Trunk */}
      <rect
        x={(width - trunkWidth) / 2}
        y={height * 0.6}
        width={trunkWidth}
        height={trunkHeight}
        fill="currentColor"
      />
    </svg>
  );
}

// Floating island decorative element
function FloatingIsland({
  className = "",
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <div className={`absolute ${className}`} aria-hidden="true">
      <svg
        width="80"
        height="60"
        viewBox="0 0 80 60"
        className={animate ? "animate-float" : ""}
        style={{ color: LANDING_COLORS.leafGreen }}
        role="presentation"
      >
        {/* Island base */}
        <ellipse
          cx="40"
          cy="50"
          rx="35"
          ry="10"
          fill={LANDING_COLORS.earthBrown}
          opacity="0.8"
        />
        {/* Grass top */}
        <rect x="10" y="40" width="60" height="12" fill="currentColor" rx="2" />
        {/* Small tree */}
        <rect
          x="35"
          y="20"
          width="10"
          height="20"
          fill={LANDING_COLORS.forestGreen}
        />
        <rect
          x="30"
          y="10"
          width="20"
          height="15"
          fill={LANDING_COLORS.forestGreen}
        />
      </svg>
    </div>
  );
}

export function HeroSection() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden pt-16">
      {/* Gradient background - dawn pink/orange to sky blue */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            #FFB5A7 0%,
            #FCD5CE 20%,
            ${LANDING_COLORS.skyBlue}80 60%,
            ${LANDING_COLORS.skyBlue} 100%
          )`,
        }}
      />

      {/* Floating decorative elements */}
      <FloatingIsland
        className="top-[20%] left-[5%] hidden opacity-60 lg:block"
        animate={!prefersReducedMotion}
      />
      <FloatingIsland
        className="top-[25%] right-[10%] hidden scale-75 opacity-50 lg:block"
        animate={!prefersReducedMotion}
      />
      <FloatingIsland
        className="top-[35%] left-[15%] hidden scale-50 opacity-40 lg:block"
        animate={!prefersReducedMotion}
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex flex-1 flex-col items-center justify-center px-4 pb-32 text-center sm:px-6 lg:px-8">
        {/* Launch badge */}
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          style={{
            backgroundColor: `${LANDING_COLORS.forestGreen}15`,
            color: LANDING_COLORS.forestGreen,
          }}
        >
          <Sparkles className="h-4 w-4" />
          Founding Family Launch - Limited to 500 Families
        </div>

        {/* Headline */}
        <h1
          className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          style={{ color: LANDING_COLORS.darkForest }}
        >
          Stop Managing Your Family. <br className="hidden sm:inline" />
          Start Leading Them.
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto mb-8 max-w-2xl text-lg sm:text-xl"
          style={{ color: LANDING_COLORS.darkForest, opacity: 0.85 }}
        >
          Most families plan day-to-day. Yours will plan
          generation-to-generation. The only goal platform built for families
          first—connecting your child's "clean room" task to your family's dream
          vacation.
        </p>

        {/* Price anchor */}
        <div className="mb-6">
          <span
            className="text-lg line-through opacity-50"
            style={{ color: LANDING_COLORS.earthBrown }}
          >
            Usually $499
          </span>
          <span
            className="ml-3 text-3xl font-bold sm:text-4xl"
            style={{ color: LANDING_COLORS.forestGreen }}
          >
            $149 Lifetime
          </span>
        </div>

        {/* CTA buttons */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          {/* Primary CTA */}
          <Button
            asChild
            size="lg"
            className="gap-2 rounded-lg px-8 py-6 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            style={{ backgroundColor: LANDING_COLORS.forestGreen }}
          >
            <Link to="/register?plan=lifetime">
              <Sparkles className="h-5 w-5" />
              Claim Your Founding Family Spot - $149 Lifetime
            </Link>
          </Button>

          {/* Secondary CTA */}
          <Button
            variant="outline"
            size="lg"
            className="gap-2 rounded-lg border-2 bg-white/80 px-8 py-6 text-base font-semibold backdrop-blur-sm transition-all hover:bg-white"
            style={{
              borderColor: LANDING_COLORS.forestGreen,
              color: LANDING_COLORS.forestGreen,
            }}
          >
            <Play className="h-5 w-5" />
            Watch Demo
          </Button>
        </div>

        {/* Spots counter */}
        <div className="w-full max-w-sm">
          <SpotsCounter
            totalSpots={500}
            remainingSpots={453}
            showIcon={false}
            variant="compact"
          />
        </div>
      </div>

      {/* Blocky forest silhouette at bottom - decorative */}
      <div
        className="absolute right-0 bottom-0 left-0 z-0"
        style={{ backgroundColor: LANDING_COLORS.darkForest }}
        aria-hidden="true"
      >
        <div className="relative h-32 sm:h-40 lg:h-48">
          {/* Forest silhouette - varying heights */}
          <div className="absolute bottom-0 flex w-full items-end justify-around">
            <BlockyTree height={80} className="hidden sm:block" />
            <BlockyTree height={100} />
            <BlockyTree height={70} className="hidden lg:block" />
            <BlockyTree height={120} />
            <BlockyTree height={90} />
            <BlockyTree height={110} className="hidden sm:block" />
            <BlockyTree height={75} />
            <BlockyTree height={130} className="hidden lg:block" />
            <BlockyTree height={85} />
            <BlockyTree height={105} className="hidden sm:block" />
            <BlockyTree height={95} />
            <BlockyTree height={115} className="hidden lg:block" />
            <BlockyTree height={80} />
          </div>
        </div>
      </div>

      {/* CSS for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float:nth-child(2) {
          animation-delay: 1s;
        }
        .animate-float:nth-child(3) {
          animation-delay: 2s;
        }
      `}</style>
    </section>
  );
}
