import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

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

// Testimonial data
const testimonials = [
  {
    quote:
      "My 8-year-old now reminds ME about morning planning! He loves checking off his 'quests' and watching his streak grow. It's transformed our chaotic mornings into something we actually look forward to.",
    author: "Marcus T.",
    role: "Dad of 2",
    duration: "Using Entmoot for 4 months",
    initials: "MT",
    color: LANDING_COLORS.forestGreen,
  },
  {
    quote:
      "As a blended family, coordinating between two households was a nightmare. Entmoot gives everyone visibility without the awkward group texts. Both houses feel like one team now.",
    author: "Jennifer & David K.",
    role: "Blended family of 6",
    duration: "Using Entmoot for 8 months",
    initials: "JD",
    color: LANDING_COLORS.skyBlue,
  },
  {
    quote:
      "I was skeptical a planning app could engage my teenager. Then she showed me her goal hierarchy connecting her weekly study goals to her dream college. Mind. Blown.",
    author: "Priya S.",
    role: "Mom of a 16-year-old",
    duration: "Using Entmoot for 6 months",
    initials: "PS",
    color: LANDING_COLORS.sunsetOrange,
  },
];

// Blocky/pixelated avatar component
function BlockyAvatar({
  initials,
  color,
}: {
  initials: string;
  color: string;
}) {
  return (
    <div
      className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg sm:h-20 sm:w-20"
      style={{
        backgroundColor: color,
        // Blocky/pixelated border effect
        boxShadow: `
          inset 2px 2px 0 0 rgba(255,255,255,0.3),
          inset -2px -2px 0 0 rgba(0,0,0,0.2),
          0 4px 8px rgba(0,0,0,0.15)
        `,
      }}
    >
      {/* Pixelated corner accents */}
      <div
        className="absolute top-0 left-0 h-2 w-2"
        style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
      />
      <div
        className="absolute right-0 bottom-0 h-2 w-2"
        style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
      />
      <span className="text-xl font-bold text-white sm:text-2xl">
        {initials}
      </span>
    </div>
  );
}

// Star rating component
function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 sm:h-5 sm:w-5"
          style={{
            color: i < rating ? LANDING_COLORS.warmGold : "#E5E7EB",
            fill: i < rating ? LANDING_COLORS.warmGold : "none",
          }}
        />
      ))}
    </div>
  );
}

// Testimonial card component
function TestimonialCard({
  quote,
  author,
  role,
  duration,
  initials,
  color,
  isActive,
}: {
  quote: string;
  author: string;
  role: string;
  duration: string;
  initials: string;
  color: string;
  isActive: boolean;
}) {
  return (
    <div
      className={`flex w-full flex-shrink-0 flex-col items-center px-4 transition-opacity duration-500 ${
        isActive ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg sm:p-8"
        style={{
          // Subtle blocky border effect
          boxShadow: `
            inset 2px 2px 0 0 rgba(255,255,255,0.8),
            inset -1px -1px 0 0 rgba(0,0,0,0.05),
            0 8px 24px rgba(0,0,0,0.1)
          `,
        }}
      >
        {/* Star rating */}
        <div className="mb-4 flex justify-center">
          <StarRating />
        </div>

        {/* Quote */}
        <blockquote
          className="mb-6 text-center text-base leading-relaxed sm:text-lg"
          style={{ color: LANDING_COLORS.earthBrown }}
        >
          "{quote}"
        </blockquote>

        {/* Author info */}
        <div className="flex flex-col items-center gap-3">
          <BlockyAvatar initials={initials} color={color} />
          <div className="text-center">
            <p
              className="text-base font-semibold sm:text-lg"
              style={{ color: LANDING_COLORS.darkForest }}
            >
              {author}
            </p>
            <p className="text-sm" style={{ color: LANDING_COLORS.earthBrown }}>
              {role}
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: LANDING_COLORS.leafGreen }}
            >
              {duration}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Carousel navigation dots
function CarouselDots({
  total,
  current,
  onSelect,
}: {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="mt-6 flex justify-center gap-2">
      {[...Array(total)].map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="h-3 w-3 rounded-full transition-all duration-300"
          style={{
            backgroundColor:
              i === current ? LANDING_COLORS.forestGreen : "#E5E7EB",
            transform: i === current ? "scale(1.2)" : "scale(1)",
          }}
          aria-label={`Go to testimonial ${i + 1}`}
        />
      ))}
    </div>
  );
}

// Navigation arrow button
function NavArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 hover:shadow-lg sm:h-12 sm:w-12"
      style={{
        color: LANDING_COLORS.forestGreen,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = LANDING_COLORS.forestGreen;
        e.currentTarget.style.color = "white";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "white";
        e.currentTarget.style.color = LANDING_COLORS.forestGreen;
      }}
      aria-label={
        direction === "prev" ? "Previous testimonial" : "Next testimonial"
      }
    >
      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
    </button>
  );
}

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  }, []);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-advance every 5 seconds, pause on hover
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      goToNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, goToNext]);

  return (
    <AnimatedSection
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: LANDING_COLORS.creamWhite }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{ color: LANDING_COLORS.darkForest }}
          >
            Tales from Fellow Adventurers
          </h2>
        </div>

        {/* Carousel container */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation arrows - hidden on mobile, visible on tablet+ */}
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-between px-2 sm:flex lg:px-4">
            <div className="pointer-events-auto">
              <NavArrow direction="prev" onClick={goToPrev} />
            </div>
            <div className="pointer-events-auto">
              <NavArrow direction="next" onClick={goToNext} />
            </div>
          </div>

          {/* Testimonial cards container */}
          <div className="relative mx-auto max-w-3xl overflow-hidden">
            <div className="relative h-[420px] sm:h-[380px]">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <TestimonialCard
                    {...testimonial}
                    isActive={index === currentIndex}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation dots */}
          <CarouselDots
            total={testimonials.length}
            current={currentIndex}
            onSelect={goToIndex}
          />

          {/* Mobile navigation arrows */}
          <div className="mt-4 flex justify-center gap-4 sm:hidden">
            <NavArrow direction="prev" onClick={goToPrev} />
            <NavArrow direction="next" onClick={goToNext} />
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
