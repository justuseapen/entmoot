import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/useScrollAnimation";

// Tree growth stages matching onboarding progress (1-6)
export type TreeStage = 1 | 2 | 3 | 4 | 5 | 6;

interface TreeAnimationProps {
  stage: TreeStage;
  className?: string;
  animate?: boolean;
}

// Color palette matching the landing page
const COLORS = {
  trunk: "#795548",
  darkGreen: "#2D5A27",
  leafGreen: "#7CB342",
  lightGreen: "#8BC34A",
  soil: "#5D4037",
  soilLight: "#795548",
  sky: "#87CEEB",
  sun: "#FFD54F",
  sunRays: "#FFF59D",
  bird: "#4A4A4A",
};

export function TreeAnimation({
  stage,
  className = "",
  animate = true,
}: TreeAnimationProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [animatedStage, setAnimatedStage] = useState<TreeStage>(stage);
  const [prevStage, setPrevStage] = useState<TreeStage>(stage);

  // Animate stage transitions only when stage prop changes
  // This avoids calling setState directly in the effect body
  if (stage !== prevStage) {
    setPrevStage(stage);
    if (!animate || prefersReducedMotion) {
      setAnimatedStage(stage);
    }
  }

  // Handle gradual animation when stage increases
  useEffect(() => {
    if (!animate || prefersReducedMotion || stage <= animatedStage) {
      return;
    }

    const timer = setTimeout(() => {
      setAnimatedStage((prev) => Math.min(prev + 1, stage) as TreeStage);
    }, 300);
    return () => clearTimeout(timer);
  }, [stage, animatedStage, animate, prefersReducedMotion]);

  // Use computed stage for rendering
  const currentStage = animatedStage;

  const shouldAnimate = animate && !prefersReducedMotion;

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full"
        aria-hidden="true"
        role="presentation"
      >
        {/* Sky background */}
        <rect x="0" y="0" width="200" height="160" fill={COLORS.sky} />

        {/* Sun (appears at stage 6) */}
        {currentStage >= 6 && (
          <g className={shouldAnimate ? "animate-sun-rise" : ""}>
            {/* Sun rays */}
            <g className={shouldAnimate ? "animate-spin-slow" : ""}>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <rect
                  key={angle}
                  x="170"
                  y="28"
                  width="4"
                  height="12"
                  fill={COLORS.sunRays}
                  transform={`rotate(${angle} 172 35)`}
                  opacity="0.7"
                />
              ))}
            </g>
            {/* Sun */}
            <circle cx="172" cy="35" r="16" fill={COLORS.sun} />
          </g>
        )}

        {/* Ground/soil */}
        <rect x="0" y="160" width="200" height="40" fill={COLORS.soil} />
        <rect x="0" y="160" width="200" height="8" fill={COLORS.soilLight} />

        {/* Stage 1: Seed */}
        {currentStage >= 1 && (
          <g className={shouldAnimate ? "animate-seed-appear" : ""}>
            {/* Seed hole */}
            <ellipse cx="100" cy="168" rx="8" ry="4" fill={COLORS.trunk} />
            {/* Seed */}
            <ellipse
              cx="100"
              cy="170"
              rx="5"
              ry="7"
              fill={COLORS.trunk}
              opacity="0.8"
            />
          </g>
        )}

        {/* Stage 2: Sprout */}
        {currentStage >= 2 && (
          <g className={shouldAnimate ? "animate-sprout-grow" : ""}>
            {/* Stem */}
            <rect
              x="98"
              y="145"
              width="4"
              height="20"
              fill={COLORS.leafGreen}
            />
            {/* First leaves */}
            <ellipse
              cx="94"
              cy="148"
              rx="8"
              ry="5"
              fill={COLORS.leafGreen}
              transform="rotate(-30 94 148)"
            />
            <ellipse
              cx="106"
              cy="148"
              rx="8"
              ry="5"
              fill={COLORS.leafGreen}
              transform="rotate(30 106 148)"
            />
          </g>
        )}

        {/* Stage 3: Sapling with small trunk */}
        {currentStage >= 3 && (
          <g className={shouldAnimate ? "animate-tree-grow" : ""}>
            {/* Trunk */}
            <rect x="95" y="120" width="10" height="45" fill={COLORS.trunk} />
            {/* Lower foliage layer */}
            <rect
              x="70"
              y="105"
              width="60"
              height="25"
              fill={COLORS.darkGreen}
            />
            {/* Upper foliage layer */}
            <rect
              x="80"
              y="85"
              width="40"
              height="25"
              fill={COLORS.leafGreen}
            />
          </g>
        )}

        {/* Stage 4: Young tree with branches */}
        {currentStage >= 4 && (
          <g className={shouldAnimate ? "animate-tree-grow" : ""}>
            {/* Wider trunk */}
            <rect x="92" y="100" width="16" height="65" fill={COLORS.trunk} />
            {/* Branch left */}
            <rect
              x="75"
              y="115"
              width="20"
              height="6"
              fill={COLORS.trunk}
              transform="rotate(-15 85 118)"
            />
            {/* Branch right */}
            <rect
              x="105"
              y="115"
              width="20"
              height="6"
              fill={COLORS.trunk}
              transform="rotate(15 115 118)"
            />
            {/* Extended foliage */}
            <rect
              x="55"
              y="85"
              width="90"
              height="35"
              fill={COLORS.darkGreen}
            />
            <rect
              x="65"
              y="60"
              width="70"
              height="30"
              fill={COLORS.leafGreen}
            />
            <rect
              x="75"
              y="45"
              width="50"
              height="20"
              fill={COLORS.lightGreen}
            />
          </g>
        )}

        {/* Stage 5: Growing tree with birds */}
        {currentStage >= 5 && (
          <g className={shouldAnimate ? "animate-birds-appear" : ""}>
            {/* Fuller foliage */}
            <rect
              x="45"
              y="70"
              width="110"
              height="50"
              fill={COLORS.darkGreen}
            />
            <rect
              x="55"
              y="45"
              width="90"
              height="35"
              fill={COLORS.leafGreen}
            />
            <rect
              x="65"
              y="30"
              width="70"
              height="25"
              fill={COLORS.lightGreen}
            />
            {/* Bird 1 - perched on branch */}
            <g transform="translate(50, 80)">
              <ellipse cx="0" cy="0" rx="5" ry="4" fill={COLORS.bird} />
              <circle cx="-4" cy="-2" r="3" fill={COLORS.bird} />
              <polygon points="-7,-2 -10,-3 -7,-3" fill="#FFA000" />
            </g>
            {/* Bird 2 - perched on other side */}
            <g transform="translate(140, 65)">
              <ellipse cx="0" cy="0" rx="5" ry="4" fill={COLORS.bird} />
              <circle cx="4" cy="-2" r="3" fill={COLORS.bird} />
              <polygon points="7,-2 10,-3 7,-3" fill="#FFA000" />
            </g>
          </g>
        )}

        {/* Stage 6: Full tree - replaces all previous foliage */}
        {currentStage >= 6 && (
          <g className={shouldAnimate ? "animate-full-tree" : ""}>
            {/* Wide trunk */}
            <rect x="88" y="90" width="24" height="75" fill={COLORS.trunk} />
            {/* Root bumps */}
            <ellipse cx="88" cy="162" rx="8" ry="5" fill={COLORS.trunk} />
            <ellipse cx="112" cy="162" rx="8" ry="5" fill={COLORS.trunk} />
            {/* Full majestic foliage layers */}
            <rect
              x="30"
              y="60"
              width="140"
              height="55"
              fill={COLORS.darkGreen}
            />
            <rect
              x="40"
              y="35"
              width="120"
              height="40"
              fill={COLORS.leafGreen}
            />
            <rect
              x="55"
              y="15"
              width="90"
              height="30"
              fill={COLORS.lightGreen}
            />
            <rect x="70" y="5" width="60" height="18" fill={COLORS.leafGreen} />
            {/* Flying birds */}
            <g
              transform="translate(25, 40)"
              className={shouldAnimate ? "animate-bird-fly" : ""}
            >
              <path
                d="M0,0 Q3,-3 6,0 Q9,-3 12,0"
                stroke={COLORS.bird}
                fill="none"
                strokeWidth="2"
              />
            </g>
            <g
              transform="translate(165, 50)"
              className={shouldAnimate ? "animate-bird-fly-2" : ""}
            >
              <path
                d="M0,0 Q3,-3 6,0 Q9,-3 12,0"
                stroke={COLORS.bird}
                fill="none"
                strokeWidth="2"
              />
            </g>
          </g>
        )}
      </svg>

      {/* CSS animations */}
      <style>{`
        @keyframes seed-appear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes sprout-grow {
          from {
            opacity: 0;
            transform: scaleY(0);
            transform-origin: bottom;
          }
          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        @keyframes tree-grow {
          from {
            opacity: 0;
            transform: scale(0.8);
            transform-origin: bottom center;
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes birds-appear {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes sun-rise {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes full-tree {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bird-fly {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-5px, -3px);
          }
        }

        @keyframes bird-fly-2 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(5px, -2px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-seed-appear {
          animation: seed-appear 0.5s ease-out;
        }

        .animate-sprout-grow {
          animation: sprout-grow 0.5s ease-out;
        }

        .animate-tree-grow {
          animation: tree-grow 0.5s ease-out;
        }

        .animate-birds-appear {
          animation: birds-appear 0.5s ease-out;
        }

        .animate-sun-rise {
          animation: sun-rise 0.8s ease-out;
        }

        .animate-full-tree {
          animation: full-tree 0.6s ease-out;
        }

        .animate-bird-fly {
          animation: bird-fly 2s ease-in-out infinite;
        }

        .animate-bird-fly-2 {
          animation: bird-fly-2 2.5s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
          transform-origin: 172px 35px;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-seed-appear,
          .animate-sprout-grow,
          .animate-tree-grow,
          .animate-birds-appear,
          .animate-sun-rise,
          .animate-full-tree,
          .animate-bird-fly,
          .animate-bird-fly-2,
          .animate-spin-slow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

// Seed transition animation for post-registration
export function SeedTransition({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"seed" | "sprouting" | "done">("seed");
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const timer1 = setTimeout(() => setPhase("sprouting"), 800);
    const timer2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-amber-50 to-green-50">
      <div className="flex flex-col items-center space-y-6">
        <div className="h-48 w-48">
          <TreeAnimation stage={phase === "seed" ? 1 : 2} animate />
        </div>
        <p className="animate-pulse text-lg font-medium text-green-700">
          Planting the seeds of your family&apos;s future...
        </p>
      </div>
    </div>
  );
}
