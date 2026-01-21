import { Link } from "react-router-dom";
import { TreePine, ArrowLeft, Mail, MessageSquare } from "lucide-react";

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

export function Contact() {
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
          Contact Us
        </h1>

        <p
          className="mb-8 text-lg"
          style={{ color: LANDING_COLORS.earthBrown }}
        >
          We'd love to hear from you! Whether you have questions, feedback, or
          just want to say hello, here's how to reach us.
        </p>

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Email */}
          <div
            className="rounded-xl bg-white p-6 shadow-sm"
            style={{ border: `1px solid ${LANDING_COLORS.forestGreen}20` }}
          >
            <div
              className="mb-4 flex items-center gap-3"
              style={{ color: LANDING_COLORS.forestGreen }}
            >
              <Mail className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Email Support</h2>
            </div>
            <p className="mb-4" style={{ color: LANDING_COLORS.earthBrown }}>
              For general inquiries, support questions, or partnership
              opportunities.
            </p>
            <a
              href="mailto:hello@entmoot.app"
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: LANDING_COLORS.forestGreen }}
            >
              hello@entmoot.app
            </a>
          </div>

          {/* Feedback */}
          <div
            className="rounded-xl bg-white p-6 shadow-sm"
            style={{ border: `1px solid ${LANDING_COLORS.forestGreen}20` }}
          >
            <div
              className="mb-4 flex items-center gap-3"
              style={{ color: LANDING_COLORS.forestGreen }}
            >
              <MessageSquare className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Feature Requests</h2>
            </div>
            <p className="mb-4" style={{ color: LANDING_COLORS.earthBrown }}>
              Have an idea for how we can make Entmoot better for your family?
              We're all ears!
            </p>
            <a
              href="mailto:feedback@entmoot.app"
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: LANDING_COLORS.forestGreen }}
            >
              feedback@entmoot.app
            </a>
          </div>
        </div>

        {/* Response Time */}
        <div
          className="mt-8 rounded-xl p-6"
          style={{ backgroundColor: `${LANDING_COLORS.forestGreen}10` }}
        >
          <p
            className="text-center"
            style={{ color: LANDING_COLORS.earthBrown }}
          >
            We typically respond to all inquiries within 24-48 hours during
            business days.
          </p>
        </div>
      </main>
    </div>
  );
}
