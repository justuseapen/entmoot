import { Quote } from "lucide-react";
import { HERITAGE_COLORS } from "./design-system";

export function SocialProofBar() {
  return (
    <section
      className="relative py-12 sm:py-16"
      style={{
        backgroundColor: HERITAGE_COLORS.cream,
        borderTop: `1px solid ${HERITAGE_COLORS.antiqueBrass}20`,
        borderBottom: `1px solid ${HERITAGE_COLORS.antiqueBrass}20`,
      }}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Founder Quote - authentic, not fabricated */}
        <div className="flex flex-col items-center text-center">
          <Quote
            className="mb-4 h-8 w-8 rotate-180"
            style={{ color: HERITAGE_COLORS.antiqueGold }}
          />
          <blockquote
            className="mb-4 text-xl font-medium italic sm:text-2xl"
            style={{
              color: HERITAGE_COLORS.charcoal,
              fontFamily: "'Georgia', serif",
            }}
          >
            Built by a dad tired of his family being four people living in the
            same house, not a team.
          </blockquote>
          <div className="flex items-center gap-3">
            {/* Founder avatar placeholder - can be replaced with actual image */}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: HERITAGE_COLORS.deepForest }}
            >
              JE
            </div>
            <div className="text-left">
              <p
                className="font-semibold"
                style={{ color: HERITAGE_COLORS.charcoal }}
              >
                Justus Eapen
              </p>
              <p className="text-sm" style={{ color: HERITAGE_COLORS.sepia }}>
                Founder, Dad of 2
              </p>
            </div>
          </div>
        </div>

        {/* Mission statement */}
        <div
          className="mt-8 rounded-lg border-l-4 p-5"
          style={{
            backgroundColor: HERITAGE_COLORS.parchment,
            borderColor: HERITAGE_COLORS.antiqueGold,
          }}
        >
          <p
            className="text-center text-sm leading-relaxed sm:text-base"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            <strong style={{ color: HERITAGE_COLORS.charcoal }}>
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
