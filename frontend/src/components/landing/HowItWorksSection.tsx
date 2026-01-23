import { Home, Map, Heart, ArrowRight } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { HERITAGE_COLORS } from "./design-system";
import { STRIPE_PAYMENT_LINK } from "@/config/pricing";

// Step data with heritage-appropriate titles
const steps = [
  {
    icon: Home,
    number: 1,
    title: "Build Your Family",
    description:
      "Create your family, invite members, and set everyone's roles. From toddlers to grandparents, everyone has a place.",
  },
  {
    icon: Map,
    number: 2,
    title: "Set Your Goals",
    description:
      "Set your first goals using our SMART builder. Let AI help you create goals that are clear, achievable, and meaningful.",
  },
  {
    icon: Heart,
    number: 3,
    title: "Grow Together",
    description:
      "Start your morning planning ritual, track progress, and celebrate wins together. Your intentional family journey begins.",
  },
];

// Step card component with heritage styling
function StepCard({
  icon: Icon,
  number,
  title,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Step number badge */}
      <div
        className="absolute -top-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
        style={{ backgroundColor: HERITAGE_COLORS.antiqueGold }}
      >
        {number}
      </div>

      {/* Icon container - elegant circular style */}
      <div
        className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border sm:h-28 sm:w-28"
        style={{
          backgroundColor: HERITAGE_COLORS.cream,
          borderColor: `${HERITAGE_COLORS.antiqueBrass}40`,
          boxShadow: "0 4px 16px rgba(28, 69, 50, 0.08)",
        }}
      >
        <Icon
          className="h-10 w-10 sm:h-12 sm:w-12"
          style={{ color: HERITAGE_COLORS.deepForest }}
        />
      </div>

      {/* Title */}
      <h3
        className="mb-2 text-lg font-semibold sm:text-xl"
        style={{
          color: HERITAGE_COLORS.charcoal,
          fontFamily: "'Georgia', serif",
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className="max-w-xs text-sm leading-relaxed sm:text-base"
        style={{ color: HERITAGE_COLORS.sepia }}
      >
        {description}
      </p>
    </div>
  );
}

// Elegant connector line
function ConnectorLine({ isVertical = false }: { isVertical?: boolean }) {
  if (isVertical) {
    return (
      <div className="flex flex-col items-center py-4">
        <div
          className="h-12 w-px"
          style={{ backgroundColor: `${HERITAGE_COLORS.antiqueBrass}40` }}
        />
        <ArrowRight
          className="mt-1 h-4 w-4 rotate-90"
          style={{ color: HERITAGE_COLORS.antiqueBrass }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center px-4 lg:px-8">
      <div
        className="h-px w-12 lg:w-20"
        style={{ backgroundColor: `${HERITAGE_COLORS.antiqueBrass}40` }}
      />
      <ArrowRight
        className="ml-1 h-4 w-4"
        style={{ color: HERITAGE_COLORS.antiqueBrass }}
      />
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <AnimatedSection
      id="how-it-works"
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: HERITAGE_COLORS.cream }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-wider"
            style={{ color: HERITAGE_COLORS.antiqueGold }}
          >
            Getting Started
          </p>
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{
              color: HERITAGE_COLORS.charcoal,
              fontFamily: "'Georgia', serif",
            }}
          >
            Three Simple Steps
          </h2>
        </div>

        {/* Steps with connector - vertical on mobile, horizontal on tablet+ */}
        <div className="flex flex-col items-center md:flex-row md:items-start md:justify-center">
          {/* Mobile layout (vertical) */}
          <div className="flex flex-col items-center md:hidden">
            <StepCard {...steps[0]} />
            <ConnectorLine isVertical />
            <StepCard {...steps[1]} />
            <ConnectorLine isVertical />
            <StepCard {...steps[2]} />
          </div>

          {/* Desktop layout (horizontal) */}
          <div className="hidden md:flex md:items-start md:justify-center">
            <StepCard {...steps[0]} />
            <ConnectorLine />
            <StepCard {...steps[1]} />
            <ConnectorLine />
            <StepCard {...steps[2]} />
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-12 text-center lg:mt-16">
          <a
            href={STRIPE_PAYMENT_LINK}
            className="inline-flex items-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              backgroundColor: HERITAGE_COLORS.deepForest,
            }}
          >
            Start Your Journey
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
}
