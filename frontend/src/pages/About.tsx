import { Link } from "react-router-dom";
import { TreePine, ArrowLeft, Heart, Users, Target } from "lucide-react";

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

export function About() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: LANDING_COLORS.creamWhite }}
    >
      {/* Header */}
      <header
        className="border-b"
        style={{ borderColor: `${LANDING_COLORS.forestGreen}20` }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <TreePine
              className="h-8 w-8"
              style={{ color: LANDING_COLORS.forestGreen }}
            />
            <span
              className="text-xl font-bold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Entmoot
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: LANDING_COLORS.forestGreen }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <h1
          className="mb-8 text-3xl font-bold sm:text-4xl"
          style={{ color: LANDING_COLORS.darkForest }}
        >
          About Entmoot
        </h1>

        {/* Mission Section */}
        <section className="mb-12">
          <div
            className="mb-4 flex items-center gap-3"
            style={{ color: LANDING_COLORS.forestGreen }}
          >
            <Heart className="h-6 w-6" />
            <h2 className="text-2xl font-semibold">Our Mission</h2>
          </div>
          <p
            className="text-lg leading-relaxed"
            style={{ color: LANDING_COLORS.earthBrown }}
          >
            Entmoot exists to help families transform from day-to-day survival
            mode into intentional, goal-driven teams. We believe every family
            deserves tools that connect daily tasks to meaningful long-term
            goals—whether that's saving for a dream vacation, building healthy
            habits together, or teaching kids the power of planning and
            achievement.
          </p>
        </section>

        {/* Why We Built This */}
        <section className="mb-12">
          <div
            className="mb-4 flex items-center gap-3"
            style={{ color: LANDING_COLORS.forestGreen }}
          >
            <Target className="h-6 w-6" />
            <h2 className="text-2xl font-semibold">Why We Built Entmoot</h2>
          </div>
          <p
            className="mb-4 text-lg leading-relaxed"
            style={{ color: LANDING_COLORS.earthBrown }}
          >
            Most productivity tools are built for individuals or businesses.
            Families have unique needs: multiple generations with different
            capabilities, shared goals that span years, and the challenge of
            keeping everyone engaged and motivated.
          </p>
          <p
            className="text-lg leading-relaxed"
            style={{ color: LANDING_COLORS.earthBrown }}
          >
            Entmoot brings together goal setting, daily planning, family
            reviews, and gamification in one place—designed from the ground up
            for how families actually work.
          </p>
        </section>

        {/* Values */}
        <section className="mb-12">
          <div
            className="mb-4 flex items-center gap-3"
            style={{ color: LANDING_COLORS.forestGreen }}
          >
            <Users className="h-6 w-6" />
            <h2 className="text-2xl font-semibold">Our Values</h2>
          </div>
          <ul className="space-y-4">
            <li
              className="text-lg"
              style={{ color: LANDING_COLORS.earthBrown }}
            >
              <strong style={{ color: LANDING_COLORS.darkForest }}>
                Family First:
              </strong>{" "}
              Every feature we build starts with the question: "Does this help
              families succeed together?"
            </li>
            <li
              className="text-lg"
              style={{ color: LANDING_COLORS.earthBrown }}
            >
              <strong style={{ color: LANDING_COLORS.darkForest }}>
                Privacy & Safety:
              </strong>{" "}
              We're COPPA compliant and take data privacy seriously. Your
              family's information stays private.
            </li>
            <li
              className="text-lg"
              style={{ color: LANDING_COLORS.earthBrown }}
            >
              <strong style={{ color: LANDING_COLORS.darkForest }}>
                No Subscription Fatigue:
              </strong>{" "}
              We offer lifetime access because we believe families shouldn't
              have to pay monthly for tools that help them thrive.
            </li>
            <li
              className="text-lg"
              style={{ color: LANDING_COLORS.earthBrown }}
            >
              <strong style={{ color: LANDING_COLORS.darkForest }}>
                Continuous Improvement:
              </strong>{" "}
              We're constantly adding features based on what real families tell
              us they need.
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: `${LANDING_COLORS.forestGreen}10` }}
        >
          <h2
            className="mb-4 text-2xl font-semibold"
            style={{ color: LANDING_COLORS.darkForest }}
          >
            Ready to transform your family's planning?
          </h2>
          <Link
            to="/register?plan=lifetime"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: LANDING_COLORS.forestGreen }}
          >
            Get Started Today
          </Link>
        </section>
      </main>
    </div>
  );
}
