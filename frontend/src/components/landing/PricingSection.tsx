import { Check } from "lucide-react";
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

// Pricing tier data
const pricingTiers = [
  {
    name: "Seedling",
    price: "Free",
    priceNote: "forever",
    memberLimit: "Up to 5 members",
    features: [
      "Core quests & goal tracking",
      "Daily planning rituals",
      "Streak tracking",
      "Basic badges & rewards",
      "Family dashboard",
    ],
    cta: "Start Free",
    ctaLink: "/register",
    isPopular: false,
  },
  {
    name: "Sapling",
    price: "$9",
    priceNote: "/month",
    memberLimit: "Up to 10 members",
    features: [
      "Everything in Seedling",
      "AI goal coaching",
      "All badges & achievements",
      "Weekly email summaries",
      "Data export",
      "Priority email support",
    ],
    cta: "Start Trial",
    ctaLink: "/register?plan=sapling",
    isPopular: true,
  },
  {
    name: "Mighty Oak",
    price: "$19",
    priceNote: "/month",
    memberLimit: "Unlimited members",
    features: [
      "Everything in Sapling",
      "Priority support",
      "Custom family badges",
      "API access",
      "Multiple families",
      "Advanced analytics",
    ],
    cta: "Contact Us",
    ctaLink: "/contact",
    isPopular: false,
  },
];

// Pricing card component
function PricingCard({
  name,
  price,
  priceNote,
  memberLimit,
  features,
  cta,
  ctaLink,
  isPopular,
}: {
  name: string;
  price: string;
  priceNote: string;
  memberLimit: string;
  features: string[];
  cta: string;
  ctaLink: string;
  isPopular: boolean;
}) {
  return (
    <div
      className="relative flex flex-col rounded-2xl bg-white p-6 sm:p-8"
      style={{
        boxShadow: isPopular
          ? `0 12px 32px rgba(45, 90, 39, 0.15)`
          : `0 8px 24px rgba(0, 0, 0, 0.08)`,
        outline: isPopular
          ? `2px solid ${LANDING_COLORS.leafGreen}`
          : undefined,
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-sm font-semibold text-white"
          style={{ backgroundColor: LANDING_COLORS.leafGreen }}
        >
          POPULAR
        </div>
      )}

      {/* Tier name */}
      <h3
        className="mb-2 text-xl font-bold sm:text-2xl"
        style={{ color: LANDING_COLORS.darkForest }}
      >
        {name}
      </h3>

      {/* Price */}
      <div className="mb-2">
        <span
          className="text-4xl font-bold sm:text-5xl"
          style={{ color: LANDING_COLORS.forestGreen }}
        >
          {price}
        </span>
        <span
          className="ml-1 text-base"
          style={{ color: LANDING_COLORS.earthBrown }}
        >
          {priceNote}
        </span>
      </div>

      {/* Member limit */}
      <p className="mb-6 text-sm" style={{ color: LANDING_COLORS.earthBrown }}>
        {memberLimit}
      </p>

      {/* Features list */}
      <ul className="mb-8 flex-1 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check
              className="mt-0.5 h-5 w-5 flex-shrink-0"
              style={{ color: LANDING_COLORS.leafGreen }}
            />
            <span
              className="text-sm"
              style={{ color: LANDING_COLORS.earthBrown }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <Link
        to={ctaLink}
        className={`block w-full rounded-lg py-3 text-center font-semibold transition-all duration-300 ${
          isPopular
            ? "text-white hover:opacity-90"
            : "hover:bg-opacity-10 border-2"
        }`}
        style={{
          backgroundColor: isPopular
            ? LANDING_COLORS.forestGreen
            : "transparent",
          borderColor: isPopular ? "transparent" : LANDING_COLORS.forestGreen,
          color: isPopular ? "white" : LANDING_COLORS.forestGreen,
        }}
        onMouseEnter={(e) => {
          if (!isPopular) {
            e.currentTarget.style.backgroundColor = `${LANDING_COLORS.forestGreen}15`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isPopular) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: LANDING_COLORS.creamWhite }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{ color: LANDING_COLORS.darkForest }}
          >
            Choose Your Adventure
          </h2>
          <p
            className="mt-4 text-lg sm:text-xl"
            style={{ color: LANDING_COLORS.earthBrown }}
          >
            Start free, upgrade when you're ready for more
          </p>
        </div>

        {/* Pricing cards grid */}
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} {...tier} />
          ))}
        </div>

        {/* Trial note */}
        <p
          className="mt-10 text-center text-sm sm:text-base"
          style={{ color: LANDING_COLORS.earthBrown }}
        >
          All plans include a 14-day free trial of Sapling features
        </p>
      </div>
    </section>
  );
}
