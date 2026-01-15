/**
 * HeyDev integration for user context and feedback
 *
 * This module provides functions to identify users to the HeyDev feedback widget,
 * enabling follow-up on feedback submissions.
 */

// Declare the global HeyDev object that's loaded by the widget script in index.html
declare global {
  interface Window {
    HeyDev?: {
      identify: (userData: {
        userId: string | number;
        email?: string;
        name?: string;
        metadata?: Record<string, string | number | boolean>;
      }) => void;
      reset: () => void;
    };
  }
}

interface UserContext {
  id: number;
  email: string;
  name?: string;
}

/**
 * Initialize HeyDev with user context when logged in.
 * Call this after authentication state is known.
 *
 * @param user - The authenticated user, or null if not logged in
 */
export function initHeyDev(user: UserContext | null): void {
  // Check if HeyDev is loaded (widget may not be present if API key is missing)
  if (!window.HeyDev) {
    // Widget not loaded - this is expected when VITE_HEYDEV_API_KEY is not configured
    return;
  }

  if (user) {
    // User is logged in - identify them to HeyDev for feedback context
    const metadata: Record<string, string | number | boolean> = {};

    // Include app version if available
    const appVersion = import.meta.env.VITE_APP_VERSION;
    if (appVersion) {
      metadata.appVersion = appVersion;
    }

    window.HeyDev.identify({
      userId: user.id,
      email: user.email,
      name: user.name,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
  } else {
    // User is logged out - reset HeyDev context
    window.HeyDev.reset();
  }
}
