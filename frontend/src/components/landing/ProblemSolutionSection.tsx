import { Check, X } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { HERITAGE_COLORS } from "./design-system";

// Pain points for "Without Entmoot" column
const painPoints = [
  { text: '"Did anyone feed the dog?"' },
  { text: '"I forgot about soccer practice!"' },
  { text: '"Who\'s picking up grandma?"' },
  { text: '"We never do anything as a family"' },
];

// Solutions for "With Entmoot" column
const solutions = [
  { text: "Clear task ownership & tracking" },
  { text: "Shared family calendar view" },
  { text: "Daily goals connected to big dreams" },
  { text: "Built-in celebration rituals" },
];

// Card component with heritage styling
function ComparisonCard({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "problem" | "solution";
}) {
  const isProblem = variant === "problem";

  return (
    <div
      className="relative rounded-xl border p-6 sm:p-8"
      style={{
        backgroundColor: isProblem
          ? "#FEF2F2"
          : HERITAGE_COLORS.cream,
        borderColor: isProblem
          ? "#FECACA"
          : `${HERITAGE_COLORS.sageGreen}50`,
      }}
    >
      {children}
    </div>
  );
}

// Pain point item component
function PainPointItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
        <X className="h-4 w-4 text-red-500" />
      </div>
      <p className="text-base font-medium text-red-800">{text}</p>
    </div>
  );
}

// Solution item component
function SolutionItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${HERITAGE_COLORS.sageGreen}30` }}
      >
        <Check
          className="h-4 w-4"
          style={{ color: HERITAGE_COLORS.deepForest }}
        />
      </div>
      <p
        className="text-base font-medium"
        style={{ color: HERITAGE_COLORS.deepForest }}
      >
        {text}
      </p>
    </div>
  );
}

export function ProblemSolutionSection() {
  return (
    <AnimatedSection
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: HERITAGE_COLORS.parchment }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{
              color: HERITAGE_COLORS.charcoal,
              fontFamily: "'Georgia', serif",
            }}
          >
            Sound Familiar?
          </h2>
          <p
            className="mt-4 text-lg"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            Most families struggle with the same challenges
          </p>
        </div>

        {/* Two-column comparison layout */}
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* Without Entmoot column */}
          <ComparisonCard variant="problem">
            <h3 className="mb-6 text-center text-xl font-semibold text-red-700 sm:text-2xl">
              Without Entmoot
            </h3>
            <div className="space-y-4">
              {painPoints.map((point, index) => (
                <PainPointItem key={index} text={point.text} />
              ))}
            </div>
          </ComparisonCard>

          {/* With Entmoot column */}
          <ComparisonCard variant="solution">
            <h3
              className="mb-6 text-center text-xl font-semibold sm:text-2xl"
              style={{ color: HERITAGE_COLORS.deepForest }}
            >
              With Entmoot
            </h3>
            <div className="space-y-4">
              {solutions.map((solution, index) => (
                <SolutionItem key={index} text={solution.text} />
              ))}
            </div>
          </ComparisonCard>
        </div>

        {/* Transition text */}
        <div className="mx-auto mt-12 max-w-3xl text-center lg:mt-16">
          <p
            className="text-lg font-medium italic sm:text-xl lg:text-2xl"
            style={{
              color: HERITAGE_COLORS.sepia,
              fontFamily: "'Georgia', serif",
            }}
          >
            "Every family deserves to feel like a team working toward shared
            dreams—not a group of strangers sharing a roof."
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
}
