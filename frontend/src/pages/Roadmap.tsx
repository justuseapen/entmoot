import { Link } from "react-router-dom";
import {
  TreePine,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lightbulb,
} from "lucide-react";

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

interface RoadmapItem {
  title: string;
  description: string;
  status: "completed" | "in-progress" | "planned";
}

const roadmapSections: {
  title: string;
  status: "completed" | "in-progress" | "planned";
  icon: typeof CheckCircle2;
  items: RoadmapItem[];
}[] = [
  {
    title: "Launched",
    status: "completed",
    icon: CheckCircle2,
    items: [
      {
        title: "Multi-scale goal planning",
        description:
          "Set goals at daily, weekly, monthly, quarterly, and annual scales",
        status: "completed",
      },
      {
        title: "Family member management",
        description: "Add family members with different roles and permissions",
        status: "completed",
      },
      {
        title: "Daily planning & evening reflection",
        description:
          "Plan your day and reflect on accomplishments each evening",
        status: "completed",
      },
      {
        title: "AI Goal Coaching",
        description:
          "Get AI-powered suggestions to refine and improve your goals",
        status: "completed",
      },
      {
        title: "Points & achievements",
        description: "Earn points for completing tasks and unlock badges",
        status: "completed",
      },
      {
        title: "Family leaderboard",
        description: "Friendly competition with family rankings",
        status: "completed",
      },
    ],
  },
  {
    title: "In Progress",
    status: "in-progress",
    icon: Clock,
    items: [
      {
        title: "Calendar integrations",
        description: "Sync with Google Calendar, Apple Calendar, and Outlook",
        status: "in-progress",
      },
      {
        title: "Mobile app",
        description: "Native iOS and Android apps for on-the-go planning",
        status: "in-progress",
      },
    ],
  },
  {
    title: "Planned",
    status: "planned",
    icon: Lightbulb,
    items: [
      {
        title: "Habit tracking",
        description: "Track daily habits and build streaks",
        status: "planned",
      },
      {
        title: "Family traditions",
        description: "Create and track recurring family traditions",
        status: "planned",
      },
      {
        title: "Photo memories",
        description: "Attach photos to completed goals and milestones",
        status: "planned",
      },
      {
        title: "Goal templates",
        description: "Pre-built goal templates for common family objectives",
        status: "planned",
      },
      {
        title: "Progress sharing",
        description: "Share achievements with extended family",
        status: "planned",
      },
    ],
  },
];

function StatusBadge({ status }: { status: RoadmapItem["status"] }) {
  const styles = {
    completed: {
      bg: `${LANDING_COLORS.leafGreen}20`,
      text: LANDING_COLORS.forestGreen,
    },
    "in-progress": {
      bg: `${LANDING_COLORS.warmGold}30`,
      text: LANDING_COLORS.earthBrown,
    },
    planned: {
      bg: `${LANDING_COLORS.skyBlue}20`,
      text: LANDING_COLORS.earthBrown,
    },
  };

  const labels = {
    completed: "Shipped",
    "in-progress": "Building",
    planned: "Planned",
  };

  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: styles[status].bg,
        color: styles[status].text,
      }}
    >
      {labels[status]}
    </span>
  );
}

export function Roadmap() {
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
          Product Roadmap
        </h1>
        <p
          className="mb-12 text-lg"
          style={{ color: LANDING_COLORS.earthBrown }}
        >
          See what we've built, what we're working on, and where we're headed.
          Have a feature request?{" "}
          <Link
            to="/contact"
            className="font-medium"
            style={{ color: LANDING_COLORS.forestGreen }}
          >
            Let us know!
          </Link>
        </p>

        <div className="space-y-12">
          {roadmapSections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.title}>
                <div className="mb-6 flex items-center gap-3">
                  <Icon
                    className="h-6 w-6"
                    style={{
                      color:
                        section.status === "completed"
                          ? LANDING_COLORS.leafGreen
                          : section.status === "in-progress"
                            ? LANDING_COLORS.warmGold
                            : LANDING_COLORS.skyBlue,
                    }}
                  />
                  <h2
                    className="text-2xl font-semibold"
                    style={{ color: LANDING_COLORS.darkForest }}
                  >
                    {section.title}
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {section.items.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl bg-white p-5 shadow-sm"
                      style={{
                        border: `1px solid ${LANDING_COLORS.forestGreen}15`,
                      }}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3
                          className="font-semibold"
                          style={{ color: LANDING_COLORS.darkForest }}
                        >
                          {item.title}
                        </h3>
                        <StatusBadge status={item.status} />
                      </div>
                      <p
                        className="text-sm"
                        style={{ color: LANDING_COLORS.earthBrown }}
                      >
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* CTA */}
        <section
          className="mt-16 rounded-xl p-8 text-center"
          style={{ backgroundColor: `${LANDING_COLORS.forestGreen}10` }}
        >
          <h2
            className="mb-4 text-2xl font-semibold"
            style={{ color: LANDING_COLORS.darkForest }}
          >
            Want to shape our roadmap?
          </h2>
          <p className="mb-6" style={{ color: LANDING_COLORS.earthBrown }}>
            Founding Family members get priority input on new features.
          </p>
          <Link
            to="/register?plan=lifetime"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: LANDING_COLORS.forestGreen }}
          >
            Join as a Founding Family
          </Link>
        </section>
      </main>
    </div>
  );
}
