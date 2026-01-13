import Appsignal from "@appsignal/javascript";

// Initialize AppSignal for frontend error tracking
// Only active in production when API key is present
const appsignal = new Appsignal({
  key: import.meta.env.VITE_APPSIGNAL_FRONTEND_KEY || "",
  revision: import.meta.env.VITE_APP_VERSION || "unknown",
  ignoreErrors: [
    // Ignore common browser extension errors
    /ResizeObserver loop/,
    /Script error/,
    /Network request failed/,
  ],
});

// Helper to manually report errors with context
export function reportError(
  error: Error,
  context?: Record<string, string | number | boolean>
) {
  if (!import.meta.env.VITE_APPSIGNAL_FRONTEND_KEY) {
    console.error("Error (AppSignal disabled):", error, context);
    return;
  }

  appsignal.sendError(error, (span) => {
    if (context) {
      span.setTags(context as Record<string, string>);
    }
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

export default appsignal;
