import { useEffect, useState, useRef } from "react";
import type { RefObject } from "react";

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check on initial render (SSR safe)
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface ScrollAnimationResult {
  ref: RefObject<HTMLDivElement | null>;
  isVisible: boolean;
  prefersReducedMotion: boolean;
}

/**
 * Hook for triggering animations when element scrolls into view
 * Respects prefers-reduced-motion preference
 */
export function useScrollAnimation(
  options: UseScrollAnimationOptions = {}
): ScrollAnimationResult {
  const { threshold = 0.2, rootMargin = "0px", triggerOnce = true } = options;

  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  // If user prefers reduced motion, start visible
  const [isVisible, setIsVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    // If user prefers reduced motion, content is already visible via initial state
    if (prefersReducedMotion) {
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, prefersReducedMotion]);

  return { ref, isVisible, prefersReducedMotion };
}

/**
 * CSS classes for fade-in animation with translate
 * Returns classes that should be applied to the animated element
 */
export function getFadeInClasses(
  isVisible: boolean,
  prefersReducedMotion: boolean
): string {
  if (prefersReducedMotion) {
    return "opacity-100"; // No animation, just show
  }

  return isVisible
    ? "opacity-100 translate-y-0 transition-all duration-700 ease-out"
    : "opacity-0 translate-y-8 transition-all duration-700 ease-out";
}

/**
 * CSS classes for staggered fade-in animation
 * @param index - The index of the element for stagger delay
 */
export function getStaggeredFadeInClasses(
  isVisible: boolean,
  prefersReducedMotion: boolean,
  index: number
): string {
  if (prefersReducedMotion) {
    return "opacity-100";
  }

  const delayClass =
    index === 0
      ? "delay-0"
      : index === 1
        ? "delay-100"
        : index === 2
          ? "delay-200"
          : index === 3
            ? "delay-300"
            : index === 4
              ? "delay-500"
              : "delay-700";

  return isVisible
    ? `opacity-100 translate-y-0 transition-all duration-700 ease-out ${delayClass}`
    : `opacity-0 translate-y-8 transition-all duration-700 ease-out ${delayClass}`;
}
