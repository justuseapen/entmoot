#!/usr/bin/env node
/**
 * Generate Entmoot app icons and splash screen
 *
 * Run: npx ts-node scripts/generate-icons.js
 * Or: node scripts/generate-icons.js (after npm install sharp)
 */

const fs = require("fs");
const path = require("path");

// Entmoot brand colors
const COLORS = {
  primary: "#4F46E5", // Indigo
  primaryDark: "#3730A3",
  secondary: "#2D5A27", // Forest green
  background: "#FFF8E7", // Cream white
  white: "#FFFFFF",
};

/**
 * Create an SVG string for the Entmoot logo
 * A stylized tree with a circular base representing family/growth
 */
function createLogoSVG(size, backgroundColor, iconColor) {
  const center = size / 2;
  const scale = size / 1024; // Scale based on 1024x1024 base

  // Tree design: trunk + stylized branches forming an E shape
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="${size * 0.15}"/>

  <!-- Circle base (family/unity) -->
  <circle cx="${center}" cy="${center}" r="${size * 0.38}" fill="${iconColor}" opacity="0.15"/>

  <!-- Tree trunk -->
  <rect x="${center - size * 0.06}" y="${center + size * 0.1}" width="${size * 0.12}" height="${size * 0.25}" rx="${size * 0.02}" fill="${iconColor}"/>

  <!-- Main tree crown (three layers representing planning scales) -->
  <!-- Bottom layer (largest) -->
  <ellipse cx="${center}" cy="${center + size * 0.05}" rx="${size * 0.28}" ry="${size * 0.12}" fill="${iconColor}"/>

  <!-- Middle layer -->
  <ellipse cx="${center}" cy="${center - size * 0.08}" rx="${size * 0.22}" ry="${size * 0.10}" fill="${iconColor}"/>

  <!-- Top layer (smallest) -->
  <ellipse cx="${center}" cy="${center - size * 0.18}" rx="${size * 0.15}" ry="${size * 0.08}" fill="${iconColor}"/>

  <!-- Star accent at top (achievement/goals) -->
  <polygon points="${center},${center - size * 0.32} ${center + size * 0.03},${center - size * 0.26} ${center + size * 0.08},${center - size * 0.26} ${center + size * 0.04},${center - size * 0.22} ${center + size * 0.06},${center - size * 0.15} ${center},${center - size * 0.19} ${center - size * 0.06},${center - size * 0.15} ${center - size * 0.04},${center - size * 0.22} ${center - size * 0.08},${center - size * 0.26} ${center - size * 0.03},${center - size * 0.26}" fill="${COLORS.white}"/>
</svg>`;
}

/**
 * Create splash screen SVG with centered logo
 */
function createSplashSVG(width, height, backgroundColor, iconColor) {
  const centerX = width / 2;
  const centerY = height / 2;
  const logoSize = Math.min(width, height) * 0.3;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>

  <!-- Centered logo -->
  <g transform="translate(${centerX - logoSize / 2}, ${centerY - logoSize / 2})">
    <!-- Circle base (family/unity) -->
    <circle cx="${logoSize / 2}" cy="${logoSize / 2}" r="${logoSize * 0.42}" fill="${iconColor}" opacity="0.15"/>

    <!-- Tree trunk -->
    <rect x="${logoSize / 2 - logoSize * 0.06}" y="${logoSize / 2 + logoSize * 0.1}" width="${logoSize * 0.12}" height="${logoSize * 0.25}" rx="${logoSize * 0.02}" fill="${iconColor}"/>

    <!-- Main tree crown -->
    <ellipse cx="${logoSize / 2}" cy="${logoSize / 2 + logoSize * 0.05}" rx="${logoSize * 0.28}" ry="${logoSize * 0.12}" fill="${iconColor}"/>
    <ellipse cx="${logoSize / 2}" cy="${logoSize / 2 - logoSize * 0.08}" rx="${logoSize * 0.22}" ry="${logoSize * 0.10}" fill="${iconColor}"/>
    <ellipse cx="${logoSize / 2}" cy="${logoSize / 2 - logoSize * 0.18}" rx="${logoSize * 0.15}" ry="${logoSize * 0.08}" fill="${iconColor}"/>

    <!-- Star accent -->
    <polygon points="${logoSize / 2},${logoSize / 2 - logoSize * 0.32} ${logoSize / 2 + logoSize * 0.03},${logoSize / 2 - logoSize * 0.26} ${logoSize / 2 + logoSize * 0.08},${logoSize / 2 - logoSize * 0.26} ${logoSize / 2 + logoSize * 0.04},${logoSize / 2 - logoSize * 0.22} ${logoSize / 2 + logoSize * 0.06},${logoSize / 2 - logoSize * 0.15} ${logoSize / 2},${logoSize / 2 - logoSize * 0.19} ${logoSize / 2 - logoSize * 0.06},${logoSize / 2 - logoSize * 0.15} ${logoSize / 2 - logoSize * 0.04},${logoSize / 2 - logoSize * 0.22} ${logoSize / 2 - logoSize * 0.08},${logoSize / 2 - logoSize * 0.26} ${logoSize / 2 - logoSize * 0.03},${logoSize / 2 - logoSize * 0.26}" fill="${COLORS.white}"/>
  </g>

  <!-- App name below logo -->
  <text x="${centerX}" y="${centerY + logoSize / 2 + 60}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="600" fill="${iconColor}" text-anchor="middle">Entmoot</text>
</svg>`;
}

/**
 * Create adaptive icon foreground SVG (Android)
 * Needs safe zone consideration (66.67% of total size)
 */
function createAdaptiveIconSVG(size, iconColor) {
  const center = size / 2;
  const safeZone = size * 0.67; // Safe zone is 66.67% of total
  const logoScale = 0.7;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Transparent background for foreground layer -->
  <rect width="${size}" height="${size}" fill="transparent"/>

  <!-- Centered logo within safe zone -->
  <g transform="translate(${center - (safeZone * logoScale) / 2}, ${center - (safeZone * logoScale) / 2})">
    ${createLogoContent(safeZone * logoScale, iconColor)}
  </g>
</svg>`;
}

function createLogoContent(size, iconColor) {
  const half = size / 2;
  return `
    <!-- Circle base -->
    <circle cx="${half}" cy="${half}" r="${size * 0.42}" fill="${iconColor}" opacity="0.15"/>

    <!-- Tree trunk -->
    <rect x="${half - size * 0.06}" y="${half + size * 0.1}" width="${size * 0.12}" height="${size * 0.25}" rx="${size * 0.02}" fill="${iconColor}"/>

    <!-- Tree crown -->
    <ellipse cx="${half}" cy="${half + size * 0.05}" rx="${size * 0.28}" ry="${size * 0.12}" fill="${iconColor}"/>
    <ellipse cx="${half}" cy="${half - size * 0.08}" rx="${size * 0.22}" ry="${size * 0.10}" fill="${iconColor}"/>
    <ellipse cx="${half}" cy="${half - size * 0.18}" rx="${size * 0.15}" ry="${size * 0.08}" fill="${iconColor}"/>

    <!-- Star accent -->
    <polygon points="${half},${half - size * 0.32} ${half + size * 0.03},${half - size * 0.26} ${half + size * 0.08},${half - size * 0.26} ${half + size * 0.04},${half - size * 0.22} ${half + size * 0.06},${half - size * 0.15} ${half},${half - size * 0.19} ${half - size * 0.06},${half - size * 0.15} ${half - size * 0.04},${half - size * 0.22} ${half - size * 0.08},${half - size * 0.26} ${half - size * 0.03},${half - size * 0.26}" fill="${COLORS.white}"/>
  `;
}

async function main() {
  const assetsDir = path.join(__dirname, "..", "assets");

  // Ensure assets directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log("Generating Entmoot app icons...\n");

  // 1. App Icon (1024x1024) - used for iOS App Store and app icon
  const iconSVG = createLogoSVG(1024, COLORS.primary, COLORS.white);
  fs.writeFileSync(path.join(assetsDir, "icon.svg"), iconSVG);
  console.log("Created: assets/icon.svg (1024x1024)");

  // 2. Adaptive Icon foreground (1024x1024) - Android
  const adaptiveIconSVG = createAdaptiveIconSVG(1024, COLORS.primary);
  fs.writeFileSync(path.join(assetsDir, "adaptive-icon.svg"), adaptiveIconSVG);
  console.log("Created: assets/adaptive-icon.svg (1024x1024)");

  // 3. Splash screen (1284x2778 for iPhone 14 Pro Max)
  const splashSVG = createSplashSVG(1284, 2778, COLORS.background, COLORS.primary);
  fs.writeFileSync(path.join(assetsDir, "splash.svg"), splashSVG);
  console.log("Created: assets/splash.svg (1284x2778)");

  // 4. Notification icon (96x96, simple white icon on transparent)
  const notificationSVG = createAdaptiveIconSVG(96, COLORS.white);
  fs.writeFileSync(path.join(assetsDir, "notification-icon.svg"), notificationSVG);
  console.log("Created: assets/notification-icon.svg (96x96)");

  console.log("\n---");
  console.log("SVG files created! To convert to PNG, run:");
  console.log("  npx svgexport assets/icon.svg assets/icon.png 1024:1024");
  console.log("  npx svgexport assets/adaptive-icon.svg assets/adaptive-icon.png 1024:1024");
  console.log("  npx svgexport assets/splash.svg assets/splash.png 1284:2778");
  console.log("  npx svgexport assets/notification-icon.svg assets/notification-icon.png 96:96");
  console.log("\nOr use https://cloudconvert.com/svg-to-png for quick conversion.");
}

main().catch(console.error);
