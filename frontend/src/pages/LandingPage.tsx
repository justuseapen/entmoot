import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProofBar } from "@/components/landing/SocialProofBar";
import { ProblemSolutionSection } from "@/components/landing/ProblemSolutionSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";

// Landing page design system colors from PRD
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

export function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      className="min-h-screen scroll-smooth"
      style={{ backgroundColor: LANDING_COLORS.creamWhite }}
    >
      <LandingNav />
      <main className="flex flex-col">
        {/* Hero Section */}
        <HeroSection />

        {/* Social Proof Bar - immediately below hero */}
        <SocialProofBar />

        {/* Problem/Solution Section */}
        <ProblemSolutionSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Pricing section placeholder - for smooth scroll target */}
        <section
          id="pricing"
          className="min-h-[50vh] px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl text-center">
            <h2
              className="text-3xl font-bold sm:text-4xl"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Pricing
            </h2>
            <p
              className="mt-4 text-lg"
              style={{ color: LANDING_COLORS.earthBrown }}
            >
              Coming soon in US-055
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
