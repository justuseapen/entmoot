import {
  Target,
  Calendar,
  CalendarDays,
  CalendarRange,
  Sparkles,
  Trophy,
} from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { HERITAGE_COLORS } from "./design-system";

// Feature data with icons, titles, and descriptions - Cal Newport multi-scale focus
const features = [
  {
    icon: Target,
    title: "AI Goal Coach",
    description:
      "Stop setting vague goals like 'get healthy.' Our AI coach guides you to SMART goals you'll actually achieve—then tracks progress and celebrates wins.",
  },
  {
    icon: Calendar,
    title: "Daily Planning",
    description:
      "Start each day with intention. Connect today's tasks to this week's priorities. Everyone knows exactly what to focus on.",
  },
  {
    icon: CalendarDays,
    title: "Weekly Family Reviews",
    description:
      "Stay aligned with 15-minute weekly check-ins. Reflect on wins, challenges, and lessons learned. Strengthen connection even when life gets busy.",
  },
  {
    icon: CalendarRange,
    title: "Multi-Scale Planning",
    description:
      "Connect daily tasks to weekly goals to quarterly milestones to annual vision. Purpose in every action. No more busy-ness without meaning.",
  },
  {
    icon: Trophy,
    title: "Gamification & Motivation",
    description:
      "Earn badges, maintain streaks, and climb the family leaderboard. Kids especially love turning progress into achievements.",
  },
  {
    icon: Sparkles,
    title: "Quarterly & Annual Reviews",
    description:
      "Deep retrospectives every 90 days. Reflect on the big picture, course-correct, and set your vision for the next phase.",
  },
];

// Feature card component with hover effects
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div
      className="group relative rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: HERITAGE_COLORS.cream,
        borderColor: `${HERITAGE_COLORS.antiqueBrass}25`,
        boxShadow: "0 4px 12px rgba(28, 69, 50, 0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(28, 69, 50, 0.1)";
        e.currentTarget.style.borderColor = `${HERITAGE_COLORS.antiqueBrass}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(28, 69, 50, 0.06)";
        e.currentTarget.style.borderColor = `${HERITAGE_COLORS.antiqueBrass}25`;
      }}
    >
      {/* Icon with heritage gold background circle */}
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: `${HERITAGE_COLORS.antiqueGold}25` }}
      >
        <Icon
          className="h-7 w-7"
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
        className="text-sm leading-relaxed sm:text-base"
        style={{ color: HERITAGE_COLORS.sepia }}
      >
        {description}
      </p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <AnimatedSection
      id="features"
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: HERITAGE_COLORS.parchment }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <p
            className="mb-3 text-sm font-medium tracking-wider uppercase"
            style={{ color: HERITAGE_COLORS.antiqueGold }}
          >
            Everything You Need
          </p>
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{
              color: HERITAGE_COLORS.charcoal,
              fontFamily: "'Georgia', serif",
            }}
          >
            Tools for Intentional Families
          </h2>
          <p
            className="mt-4 text-lg sm:text-xl"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            Everything you need to plan, reflect, and grow together
          </p>
        </div>

        {/* Feature cards grid - 1 column on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
