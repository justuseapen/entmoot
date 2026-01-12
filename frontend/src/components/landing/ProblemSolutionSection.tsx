import { Check, X } from "lucide-react";

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

// Pain points for "Without Entmoot" column
const painPoints = [
  { emoji: "🐕", text: '"Did anyone feed the dog?"' },
  { emoji: "⚽", text: '"I forgot about soccer!"' },
  { emoji: "👵", text: '"Who\'s picking up grandma?"' },
  { emoji: "😔", text: '"We never do anything fun"' },
];

// Solutions for "With Entmoot" column
const solutions = [
  { text: "Quests assigned & tracked" },
  { text: "Everyone sees the map" },
  { text: "Goals connected to dreams" },
  { text: "Celebrations built in" },
];

// Blocky card component with pixelated border style
function BlockyCard({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "problem" | "solution";
}) {
  const isProblem = variant === "problem";

  return (
    <div
      className="relative overflow-hidden rounded-lg p-6"
      style={{
        backgroundColor: isProblem ? "#FEE2E2" : "#DCFCE7",
        // Blocky/pixelated border effect using box-shadow
        boxShadow: isProblem
          ? `
            inset 4px 4px 0 0 #FECACA,
            inset -4px -4px 0 0 #FCA5A5,
            4px 4px 0 0 #F87171
          `
          : `
            inset 4px 4px 0 0 #BBF7D0,
            inset -4px -4px 0 0 #86EFAC,
            4px 4px 0 0 ${LANDING_COLORS.leafGreen}
          `,
      }}
    >
      {/* Decorative pixelated corner accents */}
      <div
        className="absolute top-0 left-0 h-2 w-2"
        style={{
          backgroundColor: isProblem ? "#F87171" : LANDING_COLORS.leafGreen,
        }}
      />
      <div
        className="absolute top-0 right-0 h-2 w-2"
        style={{
          backgroundColor: isProblem ? "#F87171" : LANDING_COLORS.leafGreen,
        }}
      />
      <div
        className="absolute bottom-0 left-0 h-2 w-2"
        style={{
          backgroundColor: isProblem ? "#F87171" : LANDING_COLORS.leafGreen,
        }}
      />
      <div
        className="absolute right-0 bottom-0 h-2 w-2"
        style={{
          backgroundColor: isProblem ? "#F87171" : LANDING_COLORS.leafGreen,
        }}
      />
      {children}
    </div>
  );
}

// Pain point item component
function PainPointItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-xl">
        {emoji}
      </div>
      <div className="flex items-center gap-2">
        <X className="h-5 w-5 flex-shrink-0 text-red-500" />
        <p className="text-base font-medium text-red-800">{text}</p>
      </div>
    </div>
  );
}

// Solution item component
function SolutionItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: LANDING_COLORS.leafGreen + "30" }}
      >
        <Check
          className="h-6 w-6"
          style={{ color: LANDING_COLORS.forestGreen }}
        />
      </div>
      <p
        className="text-base font-medium"
        style={{ color: LANDING_COLORS.forestGreen }}
      >
        {text}
      </p>
    </div>
  );
}

export function ProblemSolutionSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <h2
          className="mb-12 text-center text-3xl font-bold sm:text-4xl lg:text-5xl"
          style={{ color: LANDING_COLORS.darkForest }}
        >
          Sound Familiar?
        </h2>

        {/* Two-column comparison layout */}
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* Without Entmoot column */}
          <BlockyCard variant="problem">
            <h3 className="mb-6 text-center text-xl font-bold text-red-700 sm:text-2xl">
              Without Entmoot
            </h3>
            <div className="space-y-4">
              {painPoints.map((point, index) => (
                <PainPointItem
                  key={index}
                  emoji={point.emoji}
                  text={point.text}
                />
              ))}
            </div>
          </BlockyCard>

          {/* With Entmoot column */}
          <BlockyCard variant="solution">
            <h3
              className="mb-6 text-center text-xl font-bold sm:text-2xl"
              style={{ color: LANDING_COLORS.forestGreen }}
            >
              With Entmoot
            </h3>
            <div className="space-y-4">
              {solutions.map((solution, index) => (
                <SolutionItem key={index} text={solution.text} />
              ))}
            </div>
          </BlockyCard>
        </div>

        {/* Transition text */}
        <div className="mx-auto mt-12 max-w-3xl text-center lg:mt-16">
          <p
            className="text-lg font-medium italic sm:text-xl lg:text-2xl"
            style={{ color: LANDING_COLORS.earthBrown }}
          >
            "Every family deserves to feel like a team on an epic quest—not a
            group of strangers sharing a calendar."
          </p>
        </div>
      </div>
    </section>
  );
}
