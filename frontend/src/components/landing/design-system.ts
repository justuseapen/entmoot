/**
 * Entmoot Landing Page Design System
 *
 * Heritage aesthetic inspired by the tree of life medallion logo.
 * Traditional, timeless, and rooted in family values.
 */

// Heritage color palette - warm, earthy, traditional
export const HERITAGE_COLORS = {
  // Primary brand colors
  deepForest: "#1C4532", // Primary brand - dark forest green from logo
  antiqueGold: "#C9A227", // Accents, highlights, CTAs
  charcoal: "#2D2D2D", // Headlines, primary text

  // Neutral palette - warm, papery tones
  parchment: "#F5F0E6", // Light backgrounds
  cream: "#FFF8E7", // Cards, content areas
  sepia: "#704214", // Body text, secondary
  warmGray: "#6B6B6B", // Muted text

  // Supporting colors
  sageGreen: "#9CAF88", // Success, positive states
  antiqueBrass: "#B5894B", // Borders, dividers, accents
  dustyRose: "#C9A9A6", // Soft accents
  ivoryWhite: "#FFFFF0", // Pure backgrounds

  // Legacy colors (for gradual transition)
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  earthBrown: "#795548",
  darkForest: "#1B3A1A",
} as const;

// Typography configuration
export const TYPOGRAPHY = {
  // Font families (to be loaded via Google Fonts or local)
  fontSerif: "'Cormorant Garamond', 'Georgia', serif",
  fontSans: "system-ui, -apple-system, 'Segoe UI', sans-serif",

  // Font weights
  weightNormal: 400,
  weightMedium: 500,
  weightSemibold: 600,
  weightBold: 700,
} as const;

// Spacing scale (consistent with Tailwind)
export const SPACING = {
  section: {
    paddingY: "py-16 sm:py-20 lg:py-24",
    paddingX: "px-4 sm:px-6 lg:px-8",
  },
  container: "mx-auto max-w-7xl",
} as const;

// Common style patterns
export const PATTERNS = {
  // Card styles
  card: {
    backgroundColor: HERITAGE_COLORS.cream,
    borderRadius: "0.75rem",
    boxShadow: "0 4px 20px rgba(28, 69, 50, 0.08)",
  },

  // Elevated card
  cardElevated: {
    backgroundColor: HERITAGE_COLORS.cream,
    borderRadius: "0.75rem",
    boxShadow: "0 8px 32px rgba(28, 69, 50, 0.12)",
    border: `1px solid ${HERITAGE_COLORS.antiqueBrass}20`,
  },

  // Button primary
  buttonPrimary: {
    backgroundColor: HERITAGE_COLORS.deepForest,
    color: "white",
    borderRadius: "0.5rem",
  },

  // Button secondary (gold accent)
  buttonSecondary: {
    backgroundColor: HERITAGE_COLORS.antiqueGold,
    color: HERITAGE_COLORS.charcoal,
    borderRadius: "0.5rem",
  },
} as const;

// Gradient definitions
export const GRADIENTS = {
  // Hero background - soft, warm parchment gradient
  heroBackground: `linear-gradient(180deg,
    ${HERITAGE_COLORS.parchment} 0%,
    ${HERITAGE_COLORS.cream} 50%,
    ${HERITAGE_COLORS.ivoryWhite} 100%
  )`,

  // Footer/dark section background
  darkSection: `linear-gradient(180deg,
    ${HERITAGE_COLORS.deepForest} 0%,
    ${HERITAGE_COLORS.darkForest} 100%
  )`,

  // CTA section - warm sunset tones (more muted)
  ctaBackground: `linear-gradient(180deg,
    ${HERITAGE_COLORS.antiqueBrass} 0%,
    ${HERITAGE_COLORS.deepForest} 100%
  )`,
} as const;

// Tree of Life Medallion SVG (placeholder - to be replaced with actual logo)
export const MEDALLION_LOGO = `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="48" stroke="currentColor" stroke-width="2" fill="none"/>
  <circle cx="50" cy="50" r="44" stroke="currentColor" stroke-width="1" fill="none"/>
  <!-- Tree trunk -->
  <path d="M50 85 L50 55" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  <!-- Main branches -->
  <path d="M50 55 Q35 45 30 30" stroke="currentColor" stroke-width="2" fill="none"/>
  <path d="M50 55 Q65 45 70 30" stroke="currentColor" stroke-width="2" fill="none"/>
  <path d="M50 55 L50 25" stroke="currentColor" stroke-width="2"/>
  <!-- Roots (mirrored branches) -->
  <path d="M50 85 Q35 90 30 95" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.7"/>
  <path d="M50 85 Q65 90 70 95" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.7"/>
</svg>
`;

// CSS class utilities for heritage styling
export const CSS_CLASSES = {
  // Headline styles
  headlineHero: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight",
  headlineSection: "text-3xl sm:text-4xl lg:text-5xl font-bold",
  headlineCard: "text-xl sm:text-2xl font-semibold",

  // Body text
  bodyLarge: "text-lg sm:text-xl leading-relaxed",
  bodyBase: "text-base leading-relaxed",
  bodySmall: "text-sm leading-relaxed",

  // Decorative
  decorativeBorder: "border border-antiqueBrass/20 rounded-lg",
} as const;

export default HERITAGE_COLORS;
