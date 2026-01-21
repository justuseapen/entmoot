import { Quote } from "lucide-react";

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

export function SocialProofBar() {
  return (
    <section
      className="relative py-10 sm:py-12"
      style={{
        background: `linear-gradient(135deg, ${LANDING_COLORS.leafGreen}25 0%, ${LANDING_COLORS.forestGreen}20 100%)`,
      }}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Founder Quote - authentic, not fabricated */}
        <div className="flex flex-col items-center text-center">
          <Quote
            className="mb-4 h-8 w-8 rotate-180"
            style={{ color: LANDING_COLORS.forestGreen }}
          />
          <blockquote
            className="mb-4 text-xl font-medium italic sm:text-2xl"
            style={{ color: LANDING_COLORS.darkForest }}
          >
            Built by a dad tired of his family being four people living in the
            same house, not a team.
          </blockquote>
          <div className="flex items-center gap-3">
            {/* Founder avatar placeholder - can be replaced with actual image */}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: LANDING_COLORS.forestGreen }}
            >
              JE
            </div>
            <div className="text-left">
              <p
                className="font-semibold"
                style={{ color: LANDING_COLORS.darkForest }}
              >
                Justus Eapen
              </p>
              <p
                className="text-sm"
                style={{ color: LANDING_COLORS.earthBrown }}
              >
                Founder, Dad of 2
              </p>
            </div>
          </div>
        </div>

        {/* Mission statement */}
        <div
          className="mt-8 rounded-lg border-l-4 p-4"
          style={{
            backgroundColor: `${LANDING_COLORS.creamWhite}80`,
            borderColor: LANDING_COLORS.forestGreen,
          }}
        >
          <p
            className="text-center text-sm sm:text-base"
            style={{ color: LANDING_COLORS.earthBrown }}
          >
            <strong style={{ color: LANDING_COLORS.darkForest }}>
              Our Mission:
            </strong>{" "}
            We believe the family dinner table is the most important conference
            room in the world. Entmoot exists because chaotic families don't
            just need better tools—they need a shared language for dreaming
            together.
          </p>
        </div>
      </div>
    </section>
  );
}
