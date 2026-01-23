import { Check } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { HERITAGE_COLORS } from "./design-system";
import {
  STRIPE_PAYMENT_LINK,
  PRICE_DISPLAY,
  REGULAR_PRICE_DISPLAY,
  PRICE_COMPARISON,
} from "@/config/pricing";

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
  {
    name: "Cozi Family",
    cost: PRICE_COMPARISON.coziFamily.annual,
    tenYear: PRICE_COMPARISON.coziFamily.tenYear,
    entmoot: PRICE_DISPLAY,
  },
  {
    name: "Notion Family",
    cost: PRICE_COMPARISON.notionFamily.annual,
    tenYear: PRICE_COMPARISON.notionFamily.tenYear,
    entmoot: PRICE_DISPLAY,
  },
  {
    name: "Todoist Premium",
    cost: PRICE_COMPARISON.todoistPremium.annual,
    tenYear: PRICE_COMPARISON.todoistPremium.tenYear,
    entmoot: PRICE_DISPLAY,
  },
];

// Decorative corner element
function CornerAccent({
  position,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const rotations = {
    "top-left": "",
    "top-right": "rotate-90",
    "bottom-right": "rotate-180",
    "bottom-left": "-rotate-90",
  };

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={`absolute h-8 w-8 ${rotations[position]} ${
        position.includes("top") ? "top-3" : "bottom-3"
      } ${position.includes("left") ? "left-3" : "right-3"}`}
      style={{ color: HERITAGE_COLORS.antiqueBrass }}
      aria-hidden="true"
    >
      <path
        d="M2 2 L2 15 M2 2 L15 2"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  );
}

export function PricingSection() {
  return (
    <AnimatedSection
      id="pricing"
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: HERITAGE_COLORS.parchment }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <p
            className="mb-3 text-sm font-medium tracking-wider uppercase"
            style={{ color: HERITAGE_COLORS.antiqueGold }}
          >
            Simple Pricing
          </p>
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{
              color: HERITAGE_COLORS.charcoal,
              fontFamily: "'Georgia', serif",
            }}
          >
            Join the Founding Families
          </h2>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            One-time payment. Lifetime access. No subscriptions. Ever.
          </p>
        </div>

        {/* Single LTD Card */}
        <div className="mx-auto max-w-lg">
          <div
            className="relative flex flex-col rounded-2xl border p-8 sm:p-10"
            style={{
              backgroundColor: HERITAGE_COLORS.cream,
              borderColor: `${HERITAGE_COLORS.antiqueBrass}30`,
              boxShadow: `0 8px 32px rgba(28, 69, 50, 0.08)`,
            }}
          >
            {/* Decorative corners */}
            <CornerAccent position="top-left" />
            <CornerAccent position="top-right" />
            <CornerAccent position="bottom-left" />
            <CornerAccent position="bottom-right" />

            {/* Founding badge */}
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: HERITAGE_COLORS.deepForest }}
            >
              Founding Family Edition
            </div>

            {/* Tier name */}
            <h3
              className="mt-6 mb-4 text-center text-2xl font-bold sm:text-3xl"
              style={{
                color: HERITAGE_COLORS.charcoal,
                fontFamily: "'Georgia', serif",
              }}
            >
              Lifetime Access
            </h3>

            {/* Price */}
            <div className="mb-2 flex items-center justify-center gap-3">
              <span
                className="text-lg line-through opacity-50"
                style={{ color: HERITAGE_COLORS.sepia }}
              >
                {REGULAR_PRICE_DISPLAY}
              </span>
              <span
                className="text-5xl font-bold sm:text-6xl"
                style={{ color: HERITAGE_COLORS.deepForest }}
              >
                {PRICE_DISPLAY}
              </span>
            </div>
            <p
              className="mb-8 text-center text-sm font-medium"
              style={{ color: HERITAGE_COLORS.sepia }}
            >
              one-time payment
            </p>

            {/* Features list */}
            <ul className="mb-8 space-y-3">
              {ltdFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${HERITAGE_COLORS.sageGreen}30`,
                    }}
                  >
                    <Check
                      className="h-3 w-3"
                      style={{ color: HERITAGE_COLORS.deepForest }}
                    />
                  </div>
                  <span
                    className="text-sm sm:text-base"
                    style={{ color: HERITAGE_COLORS.sepia }}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA button */}
            <a
              href={STRIPE_PAYMENT_LINK}
              className="flex w-full items-center justify-center rounded-lg py-4 text-center text-lg font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:opacity-90"
              style={{ backgroundColor: HERITAGE_COLORS.deepForest }}
            >
              Claim Your Founding Family Spot
            </a>

            {/* Trust note */}
            <p
              className="mt-4 text-center text-xs"
              style={{ color: HERITAGE_COLORS.sepia, opacity: 0.7 }}
            >
              No credit card required to explore · Final sale, no refunds
            </p>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mx-auto mt-16 max-w-2xl">
          <h3
            className="mb-6 text-center text-xl font-semibold"
            style={{ color: HERITAGE_COLORS.charcoal }}
          >
            The Math is Simple
          </h3>
          <div
            className="overflow-hidden rounded-xl border"
            style={{
              backgroundColor: HERITAGE_COLORS.cream,
              borderColor: `${HERITAGE_COLORS.antiqueBrass}20`,
            }}
          >
            <table className="w-full">
              <thead>
                <tr
                  style={{ backgroundColor: `${HERITAGE_COLORS.deepForest}08` }}
                >
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold"
                    style={{ color: HERITAGE_COLORS.charcoal }}
                  >
                    Alternative
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-semibold"
                    style={{ color: HERITAGE_COLORS.charcoal }}
                  >
                    Annual Cost
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-semibold"
                    style={{ color: HERITAGE_COLORS.charcoal }}
                  >
                    10-Year Cost
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-semibold"
                    style={{ color: HERITAGE_COLORS.deepForest }}
                  >
                    Entmoot
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={row.name}
                    style={{
                      backgroundColor:
                        index % 2 === 1
                          ? `${HERITAGE_COLORS.parchment}50`
                          : "transparent",
                    }}
                  >
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: HERITAGE_COLORS.sepia }}
                    >
                      {row.name}
                    </td>
                    <td
                      className="px-4 py-3 text-center text-sm"
                      style={{ color: HERITAGE_COLORS.sepia }}
                    >
                      {row.cost}
                    </td>
                    <td
                      className="px-4 py-3 text-center text-sm line-through opacity-50"
                      style={{ color: HERITAGE_COLORS.sepia }}
                    >
                      {row.tenYear}
                    </td>
                    <td
                      className="px-4 py-3 text-center text-sm font-semibold"
                      style={{ color: HERITAGE_COLORS.deepForest }}
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
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            Pay once. Own forever. No more subscription fatigue.
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
}
