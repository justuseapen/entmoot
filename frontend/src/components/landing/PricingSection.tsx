import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatedSection } from "./AnimatedSection";
import { SpotsCounter } from "./SpotsCounter";

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

// LTD features list
const ltdFeatures = [
  "Unlimited family members forever",
  "AI Goal Coaching (Claude-powered)",
  "All badge collections & achievements",
  "Multi-scale reviews (daily → annual)",
  "Calendar sync (Google/Apple/Outlook)",
  "COPPA compliant & family-safe",
  "All future updates included",
  "Priority support for life",
];

// Comparison data
const comparisonData = [
  { name: "Cozi Family", cost: "$29/year", tenYear: "$290", entmoot: "$149" },
  { name: "Notion Family", cost: "$96/year", tenYear: "$960", entmoot: "$149" },
  {
    name: "Todoist Premium",
    cost: "$48/year",
    tenYear: "$480",
    entmoot: "$149",
  },
];

export function PricingSection() {
  return (
    <AnimatedSection
      id="pricing"
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: LANDING_COLORS.creamWhite }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{ color: LANDING_COLORS.darkForest }}
          >
            Join the Founding Families
          </h2>
          <p
            className="mt-4 text-lg sm:text-xl"
            style={{ color: LANDING_COLORS.earthBrown }}
          >
            One-time payment. Lifetime access. No subscriptions. Ever.
          </p>
        </div>

        {/* Single LTD Card */}
        <div className="mx-auto max-w-lg">
          <div
            className="relative flex flex-col rounded-2xl bg-white p-8 sm:p-10"
            style={{
              boxShadow: `0 12px 32px rgba(45, 90, 39, 0.15)`,
              outline: `3px solid ${LANDING_COLORS.leafGreen}`,
            }}
          >
            {/* Founding badge */}
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-6 py-2 text-sm font-bold text-white"
              style={{ backgroundColor: LANDING_COLORS.forestGreen }}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                FOUNDING FAMILY EDITION
              </span>
            </div>

            {/* Tier name */}
            <h3
              className="mt-4 mb-4 text-center text-2xl font-bold sm:text-3xl"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Lifetime Access
            </h3>

            {/* Price */}
            <div className="mb-2 text-center">
              <span
                className="text-2xl line-through opacity-50"
                style={{ color: LANDING_COLORS.earthBrown }}
              >
                $499
              </span>
              <span
                className="ml-3 text-5xl font-bold sm:text-6xl"
                style={{ color: LANDING_COLORS.forestGreen }}
              >
                $149
              </span>
            </div>
            <p
              className="mb-6 text-center text-sm font-medium"
              style={{ color: LANDING_COLORS.earthBrown }}
            >
              one-time payment • 70% off launch price
            </p>

            {/* Spots counter */}
            <div className="mb-6">
              <SpotsCounter totalSpots={500} remainingSpots={453} />
            </div>

            {/* Features list */}
            <ul className="mb-8 space-y-3">
              {ltdFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 h-5 w-5 flex-shrink-0"
                    style={{ color: LANDING_COLORS.leafGreen }}
                  />
                  <span
                    className="text-sm sm:text-base"
                    style={{ color: LANDING_COLORS.earthBrown }}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA button */}
            <Link
              to="/register?plan=lifetime"
              className="flex w-full items-center justify-center gap-2 rounded-lg py-4 text-center text-lg font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:opacity-90"
              style={{ backgroundColor: LANDING_COLORS.forestGreen }}
            >
              Claim Your Founding Family Spot
            </Link>

          </div>
        </div>

        {/* Comparison table */}
        <div className="mx-auto mt-16 max-w-2xl">
          <h3
            className="mb-6 text-center text-xl font-bold"
            style={{ color: LANDING_COLORS.darkForest }}
          >
            The Math is Simple
          </h3>
          <div className="overflow-hidden rounded-xl bg-white shadow-md">
            <table className="w-full">
              <thead>
                <tr
                  style={{ backgroundColor: `${LANDING_COLORS.forestGreen}10` }}
                >
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold"
                    style={{ color: LANDING_COLORS.darkForest }}
                  >
                    Alternative
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-semibold"
                    style={{ color: LANDING_COLORS.darkForest }}
                  >
                    Annual Cost
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-semibold"
                    style={{ color: LANDING_COLORS.darkForest }}
                  >
                    10-Year Cost
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-semibold"
                    style={{ color: LANDING_COLORS.forestGreen }}
                  >
                    Entmoot
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={row.name}
                    className={index % 2 === 1 ? "bg-gray-50" : ""}
                  >
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: LANDING_COLORS.earthBrown }}
                    >
                      {row.name}
                    </td>
                    <td
                      className="px-4 py-3 text-center text-sm"
                      style={{ color: LANDING_COLORS.earthBrown }}
                    >
                      {row.cost}
                    </td>
                    <td
                      className="px-4 py-3 text-center text-sm line-through opacity-60"
                      style={{ color: LANDING_COLORS.earthBrown }}
                    >
                      {row.tenYear}
                    </td>
                    <td
                      className="px-4 py-3 text-center text-sm font-bold"
                      style={{ color: LANDING_COLORS.forestGreen }}
                    >
                      {row.entmoot}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p
            className="mt-4 text-center text-sm"
            style={{ color: LANDING_COLORS.earthBrown }}
          >
            Pay once. Own forever. No more subscription fatigue.
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
}
