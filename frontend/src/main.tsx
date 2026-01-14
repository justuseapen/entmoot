import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { initSentry, ErrorBoundary } from "./lib/sentry";
import { ErrorFallback } from "./components/ErrorFallback";
import "./index.css";
import App from "./App.tsx";

// Initialize Sentry/Glitchtip before rendering
initSentry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary fallback={<ErrorFallback />}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);
