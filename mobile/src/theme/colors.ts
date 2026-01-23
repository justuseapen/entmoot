/**
 * Entmoot brand colors and theme palette
 */

export const COLORS = {
  // Primary brand colors
  primary: "#4F46E5", // Indigo - main action color
  primaryLight: "#818CF8",
  primaryDark: "#3730A3",

  // Secondary colors (forest/nature theme)
  secondary: "#2D5A27", // Forest green
  secondaryLight: "#4A7C44",
  secondaryDark: "#1E3D1A",

  // Semantic colors
  success: "#10B981", // Emerald
  successLight: "#34D399",
  successDark: "#059669",

  warning: "#F59E0B", // Amber
  warningLight: "#FBBF24",
  warningDark: "#D97706",

  error: "#EF4444", // Red
  errorLight: "#F87171",
  errorDark: "#DC2626",

  info: "#3B82F6", // Blue
  infoLight: "#60A5FA",
  infoDark: "#2563EB",

  // Background colors
  background: "#FFF8E7", // Cream white
  backgroundSecondary: "#F5F3EE",
  surface: "#FFFFFF",
  surfaceVariant: "#F9F9F9",

  // Text colors
  text: "#1F2937", // Gray 800
  textSecondary: "#6B7280", // Gray 500
  textTertiary: "#9CA3AF", // Gray 400
  textOnPrimary: "#FFFFFF",
  textOnSecondary: "#FFFFFF",

  // Border and divider
  border: "#E5E7EB", // Gray 200
  borderDark: "#D1D5DB", // Gray 300
  divider: "#E5E7EB",

  // Status colors for goals
  statusNotStarted: "#9CA3AF", // Gray
  statusInProgress: "#3B82F6", // Blue
  statusAtRisk: "#F59E0B", // Amber
  statusCompleted: "#10B981", // Green
  statusAbandoned: "#6B7280", // Dark gray

  // Earth tone accents
  earthBrown: "#795548",

  // Transparent variants
  transparent: "transparent",
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(0, 0, 0, 0.3)",
} as const;

export type ColorName = keyof typeof COLORS;

// React Native Paper theme configuration
export const paperThemeColors = {
  primary: COLORS.primary,
  onPrimary: COLORS.textOnPrimary,
  primaryContainer: COLORS.primaryLight,
  onPrimaryContainer: COLORS.primaryDark,
  secondary: COLORS.secondary,
  onSecondary: COLORS.textOnSecondary,
  secondaryContainer: COLORS.secondaryLight,
  onSecondaryContainer: COLORS.secondaryDark,
  tertiary: COLORS.earthBrown,
  onTertiary: COLORS.textOnPrimary,
  tertiaryContainer: "#A1887F",
  onTertiaryContainer: "#4E342E",
  error: COLORS.error,
  onError: COLORS.textOnPrimary,
  errorContainer: COLORS.errorLight,
  onErrorContainer: COLORS.errorDark,
  background: COLORS.background,
  onBackground: COLORS.text,
  surface: COLORS.surface,
  onSurface: COLORS.text,
  surfaceVariant: COLORS.surfaceVariant,
  onSurfaceVariant: COLORS.textSecondary,
  outline: COLORS.border,
  outlineVariant: COLORS.borderDark,
  shadow: "#000000",
  scrim: COLORS.overlay,
  inverseSurface: COLORS.text,
  inverseOnSurface: COLORS.surface,
  inversePrimary: COLORS.primaryLight,
  elevation: {
    level0: "transparent",
    level1: COLORS.surface,
    level2: COLORS.surfaceVariant,
    level3: COLORS.backgroundSecondary,
    level4: COLORS.backgroundSecondary,
    level5: COLORS.backgroundSecondary,
  },
};
