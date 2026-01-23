import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { HERITAGE_COLORS } from "@/components/landing/design-system";

export function Privacy() {
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
            <img src="/logo-medallion.svg" alt="Entmoot" className="h-8 w-8" />
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
          Privacy Policy
        </h1>
        <p className="mb-8 text-sm" style={{ color: HERITAGE_COLORS.sepia }}>
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
              Introduction
            </h2>
            <p className="mb-4">
              Entmoot ("we," "our," or "us") is committed to protecting your
              privacy and the privacy of your family members, especially
              children. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our
              application.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              Information We Collect
            </h2>
            <p className="mb-4">
              We collect information that you provide directly to us:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>Account information (name, email address, password)</li>
              <li>Family member information (names, roles, ages)</li>
              <li>Goals, tasks, and planning data you create</li>
              <li>Achievement and progress data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              COPPA Compliance
            </h2>
            <p className="mb-4">
              We are committed to complying with the Children's Online Privacy
              Protection Act (COPPA). We do not knowingly collect personal
              information from children under 13 without verifiable parental
              consent. Parents/guardians must create accounts for children and
              maintain control over their data.
            </p>
            <p className="mb-4">Parents have the right to:</p>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>Review their child's personal information</li>
              <li>Request deletion of their child's data</li>
              <li>Refuse further collection of their child's information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              How We Use Your Information
            </h2>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To provide customer support</li>
              <li>To improve our application</li>
              <li>
                To send you related information, including confirmations and
                updates
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              Data Security
            </h2>
            <p className="mb-4">
              We implement appropriate technical and organizational security
              measures to protect your personal information. However, no method
              of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              Data Retention
            </h2>
            <p className="mb-4">
              We retain your information for as long as your account is active
              or as needed to provide you services. You can request deletion of
              your data at any time by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              Lifetime Access Data Retention
            </h2>
            <p className="mb-4">
              For Founding Family lifetime access customers, we retain your data
              for as long as the Entmoot service remains operational. Your
              lifetime access includes all future feature updates. In the event
              of service discontinuation, we will provide advance notice and
              data export options.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              Third-Party Services
            </h2>
            <p className="mb-4">
              We may use third-party services for analytics, error tracking, and
              AI features. These services are bound by their own privacy
              policies and our data processing agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              Cookies
            </h2>
            <p className="mb-4">
              We use essential cookies to maintain your session and remember
              your preferences. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              Your Rights
            </h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              Contact Us
            </h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy or our data
              practices, please contact us at{" "}
              <a
                href="mailto:privacy@entmoot.app"
                className="font-medium"
                style={{ color: HERITAGE_COLORS.deepForest }}
              >
                privacy@entmoot.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: HERITAGE_COLORS.charcoal }}
            >
              Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the "Last updated" date.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
