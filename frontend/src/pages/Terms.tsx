import { Link } from "react-router-dom";
import { TreePine, ArrowLeft } from "lucide-react";

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

export function Terms() {
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
          className="mb-4 text-3xl font-bold sm:text-4xl"
          style={{ color: LANDING_COLORS.darkForest }}
        >
          Terms of Service
        </h1>
        <p
          className="mb-8 text-sm"
          style={{ color: LANDING_COLORS.earthBrown }}
        >
          Last updated: January 2026
        </p>

        <div
          className="prose prose-lg max-w-none"
          style={{ color: LANDING_COLORS.earthBrown }}
        >
          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Agreement to Terms
            </h2>
            <p className="mb-4">
              By accessing or using Entmoot, you agree to be bound by these
              Terms of Service. If you disagree with any part of the terms, you
              may not access the service.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Description of Service
            </h2>
            <p className="mb-4">
              Entmoot is a family planning and goal-setting platform that
              provides tools for daily planning, multi-scale reviews, AI
              coaching, and gamification features to help families achieve their
              goals together.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Accounts
            </h2>
            <p className="mb-4">
              When you create an account with us, you must provide accurate,
              complete, and current information. You are responsible for
              safeguarding your password and for all activities that occur under
              your account.
            </p>
            <p className="mb-4">
              Parents or guardians are responsible for any accounts created for
              minors under their supervision and for all activity on those
              accounts.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Lifetime Access
            </h2>
            <p className="mb-4">
              "Lifetime Access" means access to the Entmoot service for as long
              as the service remains operational. This includes all features
              available at the time of purchase and any updates we choose to
              make available.
            </p>
            <p className="mb-4">
              We reserve the right to modify, suspend, or discontinue the
              service at any time. In the event of permanent discontinuation, we
              will provide reasonable notice and, where feasible, data export
              options.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Acceptable Use
            </h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>Use the service for any unlawful purpose</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Attempt to gain unauthorized access to the service</li>
              <li>Interfere with or disrupt the service</li>
              <li>Upload malicious code or content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Intellectual Property
            </h2>
            <p className="mb-4">
              The service and its original content, features, and functionality
              are owned by Entmoot and are protected by international copyright,
              trademark, patent, trade secret, and other intellectual property
              laws.
            </p>
            <p className="mb-4">
              You retain ownership of any content you create within the service
              (goals, plans, reflections, etc.).
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Disclaimer of Warranties
            </h2>
            <p className="mb-4">
              The service is provided "as is" and "as available" without
              warranties of any kind, either express or implied. We do not
              warrant that the service will be uninterrupted, secure, or
              error-free.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Limitation of Liability
            </h2>
            <p className="mb-4">
              In no event shall Entmoot be liable for any indirect, incidental,
              special, consequential, or punitive damages resulting from your
              use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Refund Policy
            </h2>
            <p className="mb-4">
              We offer a 30-day money-back guarantee for lifetime access
              purchases. If you're not satisfied with Entmoot within 30 days of
              purchase, contact us for a full refund.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Termination
            </h2>
            <p className="mb-4">
              We may terminate or suspend your account immediately, without
              prior notice, for conduct that we believe violates these Terms or
              is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Changes to Terms
            </h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. We will
              provide notice of significant changes. Your continued use of the
              service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              Contact Us
            </h2>
            <p>
              If you have questions about these Terms, please contact us at{" "}
              <a
                href="mailto:legal@entmoot.app"
                className="font-medium"
                style={{ color: LANDING_COLORS.forestGreen }}
              >
                legal@entmoot.app
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
