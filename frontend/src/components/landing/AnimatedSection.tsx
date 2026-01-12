import type { ReactNode } from "react";
import {
  useScrollAnimation,
  getFadeInClasses,
} from "@/hooks/useScrollAnimation";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  as?: "section" | "div";
  threshold?: number;
}

/**
 * Wrapper component that adds fade-in-on-scroll animation to landing page sections
 * Respects prefers-reduced-motion preference
 */
export function AnimatedSection({
  children,
  className = "",
  style,
  id,
  as: Component = "section",
  threshold = 0.2,
}: AnimatedSectionProps) {
  const { ref, isVisible, prefersReducedMotion } = useScrollAnimation({
    threshold,
    triggerOnce: true,
  });

  const animationClasses = getFadeInClasses(isVisible, prefersReducedMotion);

  return (
    <Component
      ref={ref}
      id={id}
      className={`${animationClasses} ${className}`}
      style={style}
    >
      {children}
    </Component>
  );
}
