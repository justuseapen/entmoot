/**
 * Haptic feedback utility for consistent haptic feedback across the app.
 * Provides standardized functions for different interaction types.
 *
 * Usage:
 * - lightImpact() - for button presses, checkbox taps, navigation
 * - successNotification() - for task completion, successful actions
 * - warningNotification() - for destructive action confirmations
 * - heavyImpact() - for achievements, celebrations
 * - mediumImpact() - for swipe actions, selection changes
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Check if haptics are available on this device
// On iOS, haptics are available on iPhone 7 and later
// On Android, it depends on the device
const isHapticsAvailable = Platform.OS === "ios" || Platform.OS === "android";

/**
 * Light impact feedback - for button presses, checkbox taps, list item selection
 * Use this for most interactive elements
 */
export async function lightImpact(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silently fail if haptics not supported
  }
}

/**
 * Medium impact feedback - for swipe actions, selection changes, toggles
 * Use this for actions that feel more substantial
 */
export async function mediumImpact(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Silently fail if haptics not supported
  }
}

/**
 * Heavy impact feedback - for achievements, celebrations, major actions
 * Use this sparingly for important moments
 */
export async function heavyImpact(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // Silently fail if haptics not supported
  }
}

/**
 * Success notification feedback - for task completion, successful actions
 * Use this when something completes successfully
 */
export async function successNotification(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silently fail if haptics not supported
  }
}

/**
 * Warning notification feedback - for destructive action confirmations
 * Use this before or during destructive actions (delete, logout, etc.)
 */
export async function warningNotification(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Silently fail if haptics not supported
  }
}

/**
 * Error notification feedback - for failed actions
 * Use this when something fails or errors occur
 */
export async function errorNotification(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Silently fail if haptics not supported
  }
}

/**
 * Selection feedback - for picker changes, segment controls
 * Use this for UI elements where user makes a selection
 */
export async function selectionFeedback(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Silently fail if haptics not supported
  }
}

// Export grouped for convenience
export const haptics = {
  lightImpact,
  mediumImpact,
  heavyImpact,
  successNotification,
  warningNotification,
  errorNotification,
  selectionFeedback,
};

export default haptics;
