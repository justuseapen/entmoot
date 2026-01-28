import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingPageSEO } from "@/components/landing/LandingPageSEO";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProofBar } from "@/components/landing/SocialProofBar";
import { ProblemSolutionSection } from "@/components/landing/ProblemSolutionSection";
import { CalNewportSection } from "@/components/landing/CalNewportSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { NewsletterSignup } from "@/components/landing/NewsletterSignup";
import { HERITAGE_COLORS } from "@/components/landing/design-system";

export function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      className="min-h-screen scroll-smooth"
      style={{ backgroundColor: HERITAGE_COLORS.parchment }}
    >
      <LandingPageSEO />
      <LandingNav />
      <main className="flex flex-col">
        {/* Hero Section */}
        <HeroSection />

        {/* Social Proof Bar - Founder quote and mission */}
        <SocialProofBar />

        {/* Problem/Solution Section */}
        <ProblemSolutionSection />

        {/* Cal Newport Connection Section */}
        <CalNewportSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Founding Families Section (formerly Testimonials) */}
        <TestimonialsSection />

        {/* Pricing Section - Single LTD Card */}
        <PricingSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Final CTA Section */}
        <FinalCTASection />

        {/* Newsletter Section */}
        <section
          className="py-16 sm:py-20"
          style={{ backgroundColor: HERITAGE_COLORS.parchment }}
        >
          <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
            <NewsletterSignup variant="card" location="landing_footer" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
