/**
 * HeyDev feedback widget helpers
 *
 * The HeyDev widget is loaded via a script tag in index.html when
 * VITE_HEYDEV_API_KEY is configured. This module provides helper
 * functions for interacting with the widget programmatically.
 */

/**
 * Check if the HeyDev widget is available
 */
export function isHeyDevAvailable(): boolean {
  return typeof window !== "undefined" && !!window.HeyDev;
}

/**
 * Open the HeyDev feedback panel
 */
export function openFeedback(): void {
  window.HeyDev?.open();
}

/**
 * Close the HeyDev feedback panel
 */
export function closeFeedback(): void {
  window.HeyDev?.close();
}

/**
 * Check if the feedback panel is currently open
 */
export function isFeedbackOpen(): boolean {
  return window.HeyDev?.isOpen() ?? false;
}

/**
 * Manually capture and report an error to HeyDev
 */
export function captureError(error: Error): void {
  window.HeyDev?.captureError({
    message: error.message,
    stack: error.stack,
  });
}
