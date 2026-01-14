import * as Sentry from "@sentry/react";

// Initialize Sentry for Glitchtip error tracking
// Only active when DSN is configured
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.log("Sentry/Glitchtip disabled: VITE_SENTRY_DSN not configured");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || "unknown",

    // Sample rate for error events (1.0 = 100%)
    sampleRate: 1.0,

    // Performance monitoring (optional)
    tracesSampleRate: parseFloat(
      import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || "0.1"
    ),

    // Ignore common browser extension and network errors
    ignoreErrors: [
      /ResizeObserver loop/,
      /Script error/,
      /Network request failed/,
      /Failed to fetch/,
      /Load failed/,
    ],

    // Don't send PII by default
    sendDefaultPii: false,

    // Integration configuration
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Session replay sample rate (optional, set to 0 to disable)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
  });
}

// Helper to manually report errors with context
export function reportError(
  error: Error,
  context?: Record<string, string | number | boolean>
) {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.error("Error (Sentry disabled):", error, context);
    return;
  }

  Sentry.captureException(error, {
    tags: context as Record<string, string>,
  });
}

// Helper to wrap async functions with error reporting
export function withErrorReporting<
  T extends (...args: unknown[]) => Promise<unknown>,
>(fn: T, context?: Record<string, string | number | boolean>): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        reportError(error, context);
      }
      throw error;
    }
  }) as T;
}

// Set user context for error tracking
export function setUser(user: { id: string; email?: string } | null) {
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
}

// Re-export Sentry's ErrorBoundary for convenience
export { ErrorBoundary } from "@sentry/react";
