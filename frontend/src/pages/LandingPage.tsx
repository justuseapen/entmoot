import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

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
      className="min-h-screen"
      style={{ backgroundColor: LANDING_COLORS.creamWhite }}
    >
      {/* Placeholder content - will be replaced by subsequent landing page stories */}
      <main className="flex min-h-screen flex-col">
        {/* Hero placeholder */}
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1
            className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: LANDING_COLORS.darkForest }}
          >
            Build Your Family's Adventure
          </h1>
          <p
            className="mx-auto mb-8 max-w-2xl text-lg sm:text-xl"
            style={{ color: LANDING_COLORS.earthBrown }}
          >
            Transform chaotic days into epic quests. Entmoot helps families plan
            together, celebrate wins, and grow as a team.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: LANDING_COLORS.forestGreen }}
            >
              Start Your Free Adventure
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border-2 px-6 py-3 text-base font-medium transition-colors hover:bg-white/50"
              style={{
                borderColor: LANDING_COLORS.forestGreen,
                color: LANDING_COLORS.forestGreen,
              }}
            >
              Sign In
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
