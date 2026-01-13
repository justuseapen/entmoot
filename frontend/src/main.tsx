import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@appsignal/react";
import appsignal from "./lib/appsignal";
import "./index.css";
import App from "./App.tsx";

// Fallback UI for unrecoverable errors
function ErrorFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-gray-600">
          We've been notified and are working on a fix.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary instance={appsignal} fallback={() => <ErrorFallback />}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);
