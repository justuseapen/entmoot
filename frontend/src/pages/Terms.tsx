import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { HERITAGE_COLORS } from "@/components/landing/design-system";

export function Terms() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: HERITAGE_COLORS.parchment }}
    >
      {/* Header */}
      <header
        className="border-b"
        style={{ borderColor: `${HERITAGE_COLORS.deepForest}20` }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo-medallion.svg"
              alt="Entmoot"
              className="h-8 w-8"
            />
            <span
              className="text-xl font-bold"
              style={{
                color: HERITAGE_COLORS.charcoal,
                fontFamily: "'Georgia', serif",
              }}
            >
              Entmoot
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: HERITAGE_COLORS.deepForest }}
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
          style={{ color: HERITAGE_COLORS.charcoal }}
        >
          Terms of Service
        </h1>
        <p
          className="mb-8 text-sm"
          style={{ color: HERITAGE_COLORS.sepia }}
        >
          Last updated: January 2026
        </p>

        <div
          className="prose prose-lg max-w-none"
          style={{ color: HERITAGE_COLORS.sepia }}
        >
          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
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
              style={{ color: HERITAGE_COLORS.charcoal }}
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
              style={{ color: HERITAGE_COLORS.charcoal }}
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
              style={{ color: HERITAGE_COLORS.charcoal }}
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
              style={{ color: HERITAGE_COLORS.charcoal }}
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
              style={{ color: HERITAGE_COLORS.charcoal }}
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
              style={{ color: HERITAGE_COLORS.charcoal }}
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
              style={{ color: HERITAGE_COLORS.charcoal }}
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
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              Refund Policy - Final Sale
            </h2>
            <p className="mb-4">
              All purchases of the Founding Family Edition are final. Due to the
              nature of lifetime access and immediate product delivery, we do
              not offer refunds. Please ensure Entmoot is right for your family
              before purchasing.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
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
              style={{ color: HERITAGE_COLORS.charcoal }}
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
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              Contact Us
            </h2>
            <p>
              If you have questions about these Terms, please contact us at{" "}
              <a
                href="mailto:legal@entmoot.app"
                className="font-medium"
                style={{ color: HERITAGE_COLORS.deepForest }}
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
