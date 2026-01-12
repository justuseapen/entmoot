import { Target, Map, Sun, Moon, Trophy, Users } from "lucide-react";

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

// Feature data with icons, titles, and descriptions
const features = [
  {
    icon: Target,
    title: "SMART Quest Builder",
    description:
      "AI-powered goal creation helps you set Specific, Measurable, Achievable, Relevant, and Time-bound goals that actually stick.",
  },
  {
    icon: Map,
    title: "Goal Hierarchy Map",
    description:
      "See how daily tasks connect to weekly goals, and how weekly goals build toward your family's biggest dreams.",
  },
  {
    icon: Sun,
    title: "Morning Planning Ritual",
    description:
      "Start each day with intention. Set your top priorities and align the family in just 5 minutes.",
  },
  {
    icon: Moon,
    title: "Evening Reflection",
    description:
      "End the day with gratitude. Celebrate wins, learn from challenges, and prepare for tomorrow.",
  },
  {
    icon: Trophy,
    title: "Family Leaderboard",
    description:
      "Earn points, unlock badges, and maintain streaks. Turn everyday tasks into epic achievements.",
  },
  {
    icon: Users,
    title: "Role-Based Permissions",
    description:
      "Age-appropriate access for everyone. Adults manage, teens contribute, kids participate safely.",
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
      className="group relative rounded-xl bg-white p-6 transition-all duration-300 hover:-translate-y-1"
      style={{
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow =
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
      }}
    >
      {/* Icon with warm gold background circle */}
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: LANDING_COLORS.warmGold }}
      >
        <Icon
          className="h-7 w-7"
          style={{ color: LANDING_COLORS.darkForest }}
        />
      </div>

      {/* Title */}
      <h3
        className="mb-2 text-lg font-bold sm:text-xl"
        style={{ color: LANDING_COLORS.darkForest }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className="text-sm leading-relaxed sm:text-base"
        style={{ color: LANDING_COLORS.earthBrown }}
      >
        {description}
      </p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{ color: LANDING_COLORS.darkForest }}
          >
            Your Family's Toolkit for Epic Adventures
          </h2>
          <p
            className="mt-4 text-lg sm:text-xl"
            style={{ color: LANDING_COLORS.earthBrown }}
          >
            Everything you need to plan, play, and grow together
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
    </section>
  );
}
