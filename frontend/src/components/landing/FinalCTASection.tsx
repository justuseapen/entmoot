import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "./AnimatedSection";

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

export function FinalCTASection() {
  return (
    <AnimatedSection className="relative overflow-hidden">
      {/* Sunset gradient background - orange to purple */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            ${LANDING_COLORS.sunsetOrange} 0%,
            #F4511E 30%,
            #E91E63 60%,
            #9C27B0 100%
          )`,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex flex-col items-center justify-center px-4 pt-20 pb-40 text-center sm:px-6 sm:pt-24 sm:pb-48 lg:px-8 lg:pt-32 lg:pb-56">
        {/* Headline */}
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Your Family's Adventure Starts Today
        </h2>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-xl text-lg text-white/90 sm:text-xl">
          Join thousands of families building dreams together.
        </p>

        {/* Large CTA button */}
        <Button
          asChild
          size="lg"
          className="gap-2 rounded-lg px-10 py-7 text-lg font-semibold shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          style={{
            backgroundColor: LANDING_COLORS.forestGreen,
            color: "white",
          }}
        >
          <Link to="/register">
            <Rocket className="h-5 w-5" />
            Start Your Free Adventure
          </Link>
        </Button>

        {/* Trust text */}
        <p className="mt-6 text-sm font-medium text-white/80">
          No credit card required &bull; Setup in 2 minutes
        </p>
      </div>

      {/* Blocky forest silhouette at bottom */}
      <div
        className="absolute right-0 bottom-0 left-0 z-0"
        style={{ backgroundColor: LANDING_COLORS.darkForest }}
      >
        <div className="relative h-28 sm:h-36 lg:h-44">
          {/* Forest silhouette - varying heights */}
          <div className="absolute bottom-0 flex w-full items-end justify-around">
            <BlockyTree height={70} className="hidden sm:block" />
            <BlockyTree height={90} />
            <BlockyTree height={60} className="hidden lg:block" />
            <BlockyTree height={110} />
            <BlockyTree height={80} />
            <BlockyTree height={100} className="hidden sm:block" />
            <BlockyTree height={65} />
            <BlockyTree height={120} className="hidden lg:block" />
            <BlockyTree height={75} />
            <BlockyTree height={95} className="hidden sm:block" />
            <BlockyTree height={85} />
            <BlockyTree height={105} className="hidden lg:block" />
            <BlockyTree height={70} />
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
