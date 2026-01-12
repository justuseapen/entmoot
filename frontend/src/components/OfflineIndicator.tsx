import { useState, useEffect } from "react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Hide the reconnected message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Show nothing if online and not showing reconnected message
  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed right-4 bottom-20 left-4 z-50 md:right-4 md:bottom-4 md:left-auto md:max-w-sm ${
        isOnline ? "animate-fade-out" : ""
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-lg p-4 shadow-lg ${
          isOnline
            ? "border border-green-200 bg-green-50"
            : "border border-amber-200 bg-amber-50"
        }`}
      >
        {isOnline ? (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">Back online</p>
              <p className="text-xs text-green-600">
                Your connection has been restored
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <svg
                className="h-5 w-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">
                You&apos;re offline
              </p>
              <p className="text-xs text-amber-600">
                Some features may be unavailable
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
