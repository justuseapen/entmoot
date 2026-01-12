import { Home, Map, Rocket, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

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

// Step data
const steps = [
  {
    icon: Home,
    number: 1,
    title: "Gather Your Party",
    description:
      "Create your family, invite members, and set everyone's roles. From toddlers to grandparents, everyone has a place.",
  },
  {
    icon: Map,
    number: 2,
    title: "Chart Your Course",
    description:
      "Set your first goals using our SMART builder. Let AI help you create goals that are clear, achievable, and meaningful.",
  },
  {
    icon: Rocket,
    number: 3,
    title: "Adventure Awaits!",
    description:
      "Start your morning planning ritual, track daily quests, and celebrate wins together. Your epic family journey begins!",
  },
];

// Step card component
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
        style={{ backgroundColor: LANDING_COLORS.forestGreen }}
      >
        {number}
      </div>

      {/* Icon container - styled like a stone waypoint */}
      <div
        className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl shadow-lg sm:h-28 sm:w-28"
        style={{
          backgroundColor: LANDING_COLORS.creamWhite,
          border: `4px solid ${LANDING_COLORS.earthBrown}`,
          // Stone brick texture effect
          boxShadow: `
            inset 2px 2px 0 0 rgba(255,255,255,0.5),
            inset -2px -2px 0 0 rgba(0,0,0,0.1),
            0 4px 12px rgba(0,0,0,0.15)
          `,
        }}
      >
        <Icon
          className="h-12 w-12 sm:h-14 sm:w-14"
          style={{ color: LANDING_COLORS.forestGreen }}
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
        className="max-w-xs text-sm leading-relaxed sm:text-base"
        style={{ color: LANDING_COLORS.earthBrown }}
      >
        {description}
      </p>
    </div>
  );
}

// Stone brick pathway connector component
function PathwayConnector({ isVertical = false }: { isVertical?: boolean }) {
  if (isVertical) {
    // Vertical connector for mobile
    return (
      <div className="flex flex-col items-center py-2">
        <div
          className="flex h-12 w-6 flex-col items-center justify-around rounded"
          style={{
            backgroundColor: LANDING_COLORS.earthBrown + "30",
            border: `2px solid ${LANDING_COLORS.earthBrown}`,
          }}
        >
          {/* Stone brick pattern */}
          <div
            className="h-1.5 w-4 rounded-sm"
            style={{ backgroundColor: LANDING_COLORS.earthBrown + "60" }}
          />
          <div
            className="h-1.5 w-4 rounded-sm"
            style={{ backgroundColor: LANDING_COLORS.earthBrown + "60" }}
          />
          <div
            className="h-1.5 w-4 rounded-sm"
            style={{ backgroundColor: LANDING_COLORS.earthBrown + "60" }}
          />
        </div>
        <ChevronRight
          className="mt-1 h-5 w-5 rotate-90"
          style={{ color: LANDING_COLORS.earthBrown }}
        />
      </div>
    );
  }

  // Horizontal connector for desktop
  return (
    <div className="flex items-center px-2">
      <div
        className="flex h-6 w-16 items-center justify-around rounded lg:w-24"
        style={{
          backgroundColor: LANDING_COLORS.earthBrown + "30",
          border: `2px solid ${LANDING_COLORS.earthBrown}`,
        }}
      >
        {/* Stone brick pattern */}
        <div
          className="h-3 w-1.5 rounded-sm"
          style={{ backgroundColor: LANDING_COLORS.earthBrown + "60" }}
        />
        <div
          className="h-3 w-1.5 rounded-sm"
          style={{ backgroundColor: LANDING_COLORS.earthBrown + "60" }}
        />
        <div
          className="h-3 w-1.5 rounded-sm"
          style={{ backgroundColor: LANDING_COLORS.earthBrown + "60" }}
        />
        <div
          className="hidden h-3 w-1.5 rounded-sm lg:block"
          style={{ backgroundColor: LANDING_COLORS.earthBrown + "60" }}
        />
      </div>
      <ChevronRight
        className="ml-1 h-5 w-5"
        style={{ color: LANDING_COLORS.earthBrown }}
      />
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: LANDING_COLORS.leafGreen + "15" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{ color: LANDING_COLORS.darkForest }}
          >
            Begin Your Adventure in 3 Simple Steps
          </h2>
        </div>

        {/* Steps with pathway - vertical on mobile, horizontal on tablet+ */}
        <div className="flex flex-col items-center md:flex-row md:items-start md:justify-center">
          {/* Mobile layout (vertical) */}
          <div className="flex flex-col items-center md:hidden">
            <StepCard {...steps[0]} />
            <PathwayConnector isVertical />
            <StepCard {...steps[1]} />
            <PathwayConnector isVertical />
            <StepCard {...steps[2]} />
          </div>

          {/* Desktop layout (horizontal) */}
          <div className="hidden md:flex md:items-start md:justify-center">
            <StepCard {...steps[0]} />
            <PathwayConnector />
            <StepCard {...steps[1]} />
            <PathwayConnector />
            <StepCard {...steps[2]} />
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-12 text-center lg:mt-16">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            style={{
              backgroundColor: LANDING_COLORS.forestGreen,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = LANDING_COLORS.darkForest;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                LANDING_COLORS.forestGreen;
            }}
          >
            Begin Your Free Quest
            <Rocket className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
