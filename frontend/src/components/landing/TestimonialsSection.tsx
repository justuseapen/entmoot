import { Users, Star, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "./AnimatedSection";
import { HERITAGE_COLORS } from "./design-system";
import { STRIPE_PAYMENT_LINK, PRICE_DISPLAY } from "@/config/pricing";

// Founding member benefit item
function BenefitItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          backgroundColor: `${HERITAGE_COLORS.deepForest}10`,
          color: HERITAGE_COLORS.deepForest,
        }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3
        className="mb-2 text-lg font-semibold"
        style={{ color: HERITAGE_COLORS.charcoal }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: HERITAGE_COLORS.sepia }}
      >
        {description}
      </p>
    </div>
  );
}

// Decorative tree ring element
function TreeRing({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        className="h-full w-full"
        style={{ color: HERITAGE_COLORS.antiqueBrass }}
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          opacity="0.2"
        />
        <circle
          cx="50"
          cy="50"
          r="35"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          opacity="0.15"
        />
        <circle
          cx="50"
          cy="50"
          r="25"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          opacity="0.1"
        />
        <circle
          cx="50"
          cy="50"
          r="15"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          opacity="0.05"
        />
      </svg>
    </div>
  );
}

export function TestimonialsSection() {
  const benefits = [
    {
      icon: Star,
      title: "Shape the Future",
      description:
        "Your feedback directly influences which features we build next. Founding families have a voice in our roadmap.",
    },
    {
      icon: Users,
      title: "Exclusive Community",
      description:
        "Join a private community of intentional families. Share strategies, celebrate wins, and grow together.",
    },
    {
      icon: Heart,
      title: "Lifetime Recognition",
      description:
        "Founding Family badge on your profile forever. You believed in us from the beginning—we won't forget.",
    },
  ];

  return (
    <AnimatedSection
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: HERITAGE_COLORS.cream }}
    >
      {/* Decorative tree rings */}
      <TreeRing className="absolute top-1/4 -left-12 h-48 w-48 opacity-50" />
      <TreeRing className="absolute -right-8 bottom-1/4 h-32 w-32 opacity-30" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-16">
          <p
            className="mb-3 text-sm font-medium tracking-wider uppercase"
            style={{ color: HERITAGE_COLORS.antiqueGold }}
          >
            Be Part of Something Special
          </p>
          <h2
            className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{
              color: HERITAGE_COLORS.charcoal,
              fontFamily: "'Georgia', serif",
            }}
          >
            We're Looking for Our First Families
          </h2>
          <p
            className="text-lg leading-relaxed"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            Every great product starts with believers. As a Founding Family,
            you'll help us build the family planning platform you've always
            wanted—and your story could inspire thousands of families to come.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="mb-12 grid gap-8 sm:grid-cols-3 lg:mb-16">
          {benefits.map((benefit) => (
            <BenefitItem key={benefit.title} {...benefit} />
          ))}
        </div>

        {/* CTA Card */}
        <div
          className="mx-auto max-w-2xl rounded-2xl border p-8 text-center sm:p-10"
          style={{
            backgroundColor: HERITAGE_COLORS.parchment,
            borderColor: `${HERITAGE_COLORS.antiqueBrass}30`,
          }}
        >
          <p
            className="mb-2 text-sm font-medium"
            style={{ color: HERITAGE_COLORS.antiqueGold }}
          >
            Limited to 100 Founding Families
          </p>
          <h3
            className="mb-4 text-2xl font-bold sm:text-3xl"
            style={{ color: HERITAGE_COLORS.charcoal }}
          >
            Will Your Family Be One of Them?
          </h3>
          <p
            className="mb-6 text-base leading-relaxed"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            Join the founding families who are building intentional family
            cultures. Share your journey, and your testimonial could help
            another family transform their daily chaos into lasting memories.
          </p>

          <Button
            asChild
            size="lg"
            className="group gap-2 rounded-lg px-8 py-6 text-base font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{ backgroundColor: HERITAGE_COLORS.deepForest }}
          >
            <a href={STRIPE_PAYMENT_LINK}>
              Become a Founding Family
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>

          <p
            className="mt-4 text-xs"
            style={{ color: HERITAGE_COLORS.sepia, opacity: 0.7 }}
          >
            {PRICE_DISPLAY} lifetime · No subscriptions · Help shape the product
          </p>
        </div>

        {/* Future testimonials placeholder note - visible to help with content strategy */}
        <p
          className="mt-8 text-center text-xs italic"
          style={{ color: HERITAGE_COLORS.sepia, opacity: 0.5 }}
        >
          Real testimonials from founding families coming soon
        </p>
      </div>
    </AnimatedSection>
  );
}
