import { useEffect, useRef, useState } from "react";
import { TreePine, Star, Quote } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/useScrollAnimation";

// Landing page design system colors
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

// Hook for animated count-up effect using Intersection Observer
function useCountUp(
  target: number,
  duration: number = 2000,
  start: boolean = false
): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [target, duration, start]);

  return count;
}

// Star rating display component
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4"
          style={{
            color: LANDING_COLORS.warmGold,
            fill:
              i < fullStars || (i === fullStars && hasHalfStar)
                ? LANDING_COLORS.warmGold
                : "none",
          }}
        />
      ))}
    </div>
  );
}

export function SocialProofBar() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  // If user prefers reduced motion, start visible
  const [isVisible, setIsVisible] = useState(prefersReducedMotion);

  // Intersection Observer to trigger count-up when scrolled into view
  useEffect(() => {
    // If user prefers reduced motion, content is already visible via initial state
    if (prefersReducedMotion) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible, prefersReducedMotion]);

  // If user prefers reduced motion, show final values immediately without animation
  const familyCount = useCountUp(
    2847,
    prefersReducedMotion ? 0 : 2000,
    isVisible
  );
  const reviewCount = useCountUp(
    500,
    prefersReducedMotion ? 0 : 1500,
    isVisible
  );

  return (
    <section
      ref={sectionRef}
      className="relative py-8 sm:py-10"
      style={{
        background: `linear-gradient(135deg, ${LANDING_COLORS.leafGreen}25 0%, ${LANDING_COLORS.forestGreen}20 100%)`,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between lg:gap-8">
          {/* Stat: Families Adventuring */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: LANDING_COLORS.forestGreen + "20" }}
            >
              <TreePine
                className="h-6 w-6"
                style={{ color: LANDING_COLORS.forestGreen }}
              />
            </div>
            <div>
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: LANDING_COLORS.darkForest }}
              >
                {familyCount.toLocaleString()}
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: LANDING_COLORS.earthBrown }}
              >
                Families Adventuring
              </p>
            </div>
          </div>

          {/* Stat: Reviews Rating */}
          <div className="flex items-center gap-3">
            <div className="text-center sm:text-left">
              <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
                <p
                  className="text-2xl font-bold"
                  style={{ color: LANDING_COLORS.darkForest }}
                >
                  4.9/5
                </p>
                <StarRating rating={4.9} />
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: LANDING_COLORS.earthBrown }}
              >
                from{" "}
                <span className="tabular-nums">
                  {reviewCount.toLocaleString()}+
                </span>{" "}
                reviews
              </p>
            </div>
          </div>

          {/* Featured Quote */}
          <div className="max-w-md text-center sm:text-right">
            <div className="flex items-start gap-2">
              <Quote
                className="mt-1 h-5 w-5 flex-shrink-0 rotate-180"
                style={{ color: LANDING_COLORS.leafGreen }}
              />
              <div>
                <p
                  className="text-base font-medium italic"
                  style={{ color: LANDING_COLORS.darkForest }}
                >
                  Finally, a planning app my kids actually WANT to use!
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: LANDING_COLORS.earthBrown }}
                >
                  — Sarah M., Mom of 3
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
