import { AnimatedSection } from "./AnimatedSection";
import { HERITAGE_COLORS } from "./design-system";

// Mapping data showing Cal Newport system vs Entmoot
const mappingData = [
  {
    calNewport: "Daily time blocking",
    entmoot: "Daily family coordination",
  },
  {
    calNewport: "Weekly review",
    entmoot: "Weekly family review",
  },
  {
    calNewport: "Quarterly planning",
    entmoot: "Quarterly family retrospectives",
  },
  {
    calNewport: "Annual strategic plan",
    entmoot: "Annual family vision setting",
  },
  {
    calNewport: "Task-goal alignment",
    entmoot: "Every task connects to family goals",
  },
];

export function CalNewportSection() {
  return (
    <AnimatedSection
      id="cal-newport"
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: HERITAGE_COLORS.cream }}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <p
            className="mb-3 text-sm font-medium tracking-wider uppercase"
            style={{ color: HERITAGE_COLORS.antiqueGold }}
          >
            The Method
          </p>
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{
              color: HERITAGE_COLORS.charcoal,
              fontFamily: "'Georgia', serif",
            }}
          >
            From Study Hacks to Family Life
          </h2>
        </div>

        {/* Explanation text */}
        <div className="mx-auto mb-12 max-w-2xl">
          <p
            className="text-lg leading-relaxed"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            If you've read Cal Newport's work on time blocking and multi-scale
            planning, you know these frameworks are life-changing for work.
          </p>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            You plan your days with intention. You review your week. You set
            quarterly goals. You connect daily actions to annual vision.
          </p>
          <p
            className="mt-4 text-lg font-semibold"
            style={{ color: HERITAGE_COLORS.charcoal }}
          >
            But what about your family?
          </p>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            Most parents keep their productivity system at work and come home to
            chaos. Calendar apps, reactive scheduling, no strategic planning.
          </p>
          <p
            className="mt-4 text-lg leading-relaxed font-medium"
            style={{ color: HERITAGE_COLORS.deepForest }}
          >
            Entmoot changes that. It's Cal Newport's multi-scale planning
            philosophy—adapted for families.
          </p>
        </div>

        {/* Comparison table */}
        <div
          className="overflow-hidden rounded-xl border"
          style={{
            backgroundColor: HERITAGE_COLORS.parchment,
            borderColor: `${HERITAGE_COLORS.antiqueBrass}30`,
          }}
        >
          <table className="w-full">
            <thead>
              <tr
                style={{ backgroundColor: `${HERITAGE_COLORS.deepForest}10` }}
              >
                <th
                  className="px-6 py-4 text-left text-sm font-semibold sm:text-base"
                  style={{ color: HERITAGE_COLORS.charcoal }}
                >
                  Cal Newport's System
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold sm:text-base"
                  style={{ color: HERITAGE_COLORS.deepForest }}
                >
                  Entmoot for Families
                </th>
              </tr>
            </thead>
            <tbody>
              {mappingData.map((row, index) => (
                <tr
                  key={row.calNewport}
                  style={{
                    backgroundColor:
                      index % 2 === 1 ? HERITAGE_COLORS.cream : "transparent",
                    borderTop: `1px solid ${HERITAGE_COLORS.antiqueBrass}15`,
                  }}
                >
                  <td
                    className="px-6 py-4 text-sm sm:text-base"
                    style={{ color: HERITAGE_COLORS.sepia }}
                  >
                    {row.calNewport}
                  </td>
                  <td
                    className="px-6 py-4 text-sm font-medium sm:text-base"
                    style={{ color: HERITAGE_COLORS.deepForest }}
                  >
                    {row.entmoot}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Result statement */}
        <div className="mt-10 text-center">
          <p
            className="text-lg font-medium sm:text-xl"
            style={{ color: HERITAGE_COLORS.charcoal }}
          >
            <strong style={{ color: HERITAGE_COLORS.deepForest }}>
              The result?
            </strong>{" "}
            The same clarity, intention, and progress you get at work—now at
            home with your family.
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
}
