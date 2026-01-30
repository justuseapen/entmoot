import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "./AnimatedSection";
import { HERITAGE_COLORS } from "./design-system";
import { STRIPE_PAYMENT_LINK, PRICE_DISPLAY } from "@/config/pricing";

// Elegant tree silhouette for the bottom
function TreeSilhouette({
  height,
  className = "",
}: {
  height: number;
  className?: string;
}) {
  const width = height * 0.5;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ color: HERITAGE_COLORS.deepForest }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Elegant tree shape - organic curves instead of blocky */}
      <path
        d={`
          M${width * 0.5} 0
          Q${width * 0.3} ${height * 0.15} ${width * 0.2} ${height * 0.3}
          Q${width * 0.35} ${height * 0.35} ${width * 0.3} ${height * 0.5}
          Q${width * 0.15} ${height * 0.55} ${width * 0.1} ${height * 0.7}
          L${width * 0.4} ${height * 0.7}
          L${width * 0.4} ${height}
          L${width * 0.6} ${height}
          L${width * 0.6} ${height * 0.7}
          L${width * 0.9} ${height * 0.7}
          Q${width * 0.85} ${height * 0.55} ${width * 0.7} ${height * 0.5}
          Q${width * 0.65} ${height * 0.35} ${width * 0.8} ${height * 0.3}
          Q${width * 0.7} ${height * 0.15} ${width * 0.5} 0
          Z
        `}
        fill="currentColor"
        opacity="0.15"
      />
    </svg>
  );
}

export function FinalCTASection() {
  return (
    <AnimatedSection className="relative overflow-hidden">
      {/* Gradient background - warm heritage tones */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            ${HERITAGE_COLORS.deepForest} 0%,
            ${HERITAGE_COLORS.darkForest} 100%
          )`,
        }}
      />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex flex-col items-center justify-center px-4 pt-20 pb-32 text-center sm:px-6 sm:pt-24 sm:pb-40 lg:px-8 lg:pt-32 lg:pb-48">
        {/* Decorative line */}
        <div className="mb-8 flex items-center gap-4">
          <div
            className="h-px w-12 sm:w-20"
            style={{ backgroundColor: `${HERITAGE_COLORS.antiqueGold}50` }}
          />
          <div
            className="h-1.5 w-1.5 rotate-45"
            style={{ backgroundColor: HERITAGE_COLORS.antiqueGold }}
          />
          <div
            className="h-px w-12 sm:w-20"
            style={{ backgroundColor: `${HERITAGE_COLORS.antiqueGold}50` }}
          />
        </div>

        {/* Headline */}
        <h2
          className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          Ready to Transform Your Family? <br className="hidden sm:inline" />
          <span style={{ color: HERITAGE_COLORS.antiqueGold }}>
            Join 100 Pioneering Families
          </span>
        </h2>

        {/* Subheadline */}
        <p
          className="mx-auto mb-10 max-w-xl text-lg sm:text-xl"
          style={{ color: `${HERITAGE_COLORS.parchment}CC` }}
        >
          Building the future of intentional family planning together.
        </p>

        {/* Large CTA button */}
        <Button
          asChild
          size="lg"
          className="group gap-2 rounded-lg px-10 py-7 text-lg font-semibold shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
          style={{
            backgroundColor: HERITAGE_COLORS.antiqueGold,
            color: HERITAGE_COLORS.charcoal,
          }}
        >
          <a href={STRIPE_PAYMENT_LINK}>
            Get Lifetime Access - {PRICE_DISPLAY}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>
        </Button>

        {/* Trust text */}
        <p
          className="mt-6 text-sm font-medium"
          style={{ color: `${HERITAGE_COLORS.parchment}99` }}
        >
          One-time payment · No subscriptions · Lifetime access
        </p>
      </div>

      {/* Elegant tree silhouettes at bottom */}
      <div className="absolute right-0 bottom-0 left-0 z-0" aria-hidden="true">
        <div className="relative h-24 sm:h-32 lg:h-40">
          <div className="absolute bottom-0 flex w-full items-end justify-around opacity-30">
            <TreeSilhouette height={60} className="hidden sm:block" />
            <TreeSilhouette height={80} />
            <TreeSilhouette height={50} className="hidden lg:block" />
            <TreeSilhouette height={100} />
            <TreeSilhouette height={70} />
            <TreeSilhouette height={90} className="hidden sm:block" />
            <TreeSilhouette height={55} />
            <TreeSilhouette height={110} className="hidden lg:block" />
            <TreeSilhouette height={65} />
            <TreeSilhouette height={85} className="hidden sm:block" />
            <TreeSilhouette height={75} />
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
