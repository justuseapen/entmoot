import { Check, X } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { HERITAGE_COLORS } from "./design-system";

// Pain points for "At Work" column
const workFeatures = [
  { text: "Time blocking your calendar" },
  { text: "Weekly reviews and planning" },
  { text: "Quarterly goals and OKRs" },
  { text: "Annual strategic planning" },
];

// Pain points for "At Home" column - showing the gap
const homeProblems = [
  { text: "Reactive scheduling chaos" },
  { text: "No time to reflect together" },
  { text: "Vague or forgotten goals" },
  { text: "Just surviving, not thriving" },
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
        backgroundColor: isProblem ? "#FEF2F2" : HERITAGE_COLORS.cream,
        borderColor: isProblem ? "#FECACA" : `${HERITAGE_COLORS.sageGreen}50`,
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
            You Plan Your Work Life. What About Your Family?
          </h2>
          <p className="mt-4 text-lg" style={{ color: HERITAGE_COLORS.sepia }}>
            You know the frameworks work. Why doesn't your family have the same
            system?
          </p>
        </div>

        {/* Two-column comparison layout */}
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* At Work column */}
          <ComparisonCard variant="solution">
            <h3
              className="mb-6 text-center text-xl font-semibold sm:text-2xl"
              style={{ color: HERITAGE_COLORS.deepForest }}
            >
              At Work
            </h3>
            <div className="space-y-4">
              {workFeatures.map((item, index) => (
                <SolutionItem key={index} text={item.text} />
              ))}
            </div>
          </ComparisonCard>

          {/* At Home column */}
          <ComparisonCard variant="problem">
            <h3 className="mb-6 text-center text-xl font-semibold text-red-700 sm:text-2xl">
              At Home
            </h3>
            <div className="space-y-4">
              {homeProblems.map((point, index) => (
                <PainPointItem key={index} text={point.text} />
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
            "Most family apps are just digital calendars. Entmoot is the layer
            above—the 'why' behind the 'what.'"
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
}
