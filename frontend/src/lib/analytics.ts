/**
 * Google Analytics 4 Event Tracking
 *
 * This module provides type-safe event tracking for GA4.
 * Replace GA_MEASUREMENT_ID with your actual GA4 measurement ID.
 */

// Replace with your actual GA4 measurement ID
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "";

// Declare gtag function type
declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

// Check if analytics is enabled
export function isAnalyticsEnabled(): boolean {
  return Boolean(GA_MEASUREMENT_ID && typeof window !== "undefined" && window.gtag);
}

// Track page views (called automatically by router, but can be called manually)
export function trackPageView(url: string, title?: string): void {
  if (!isAnalyticsEnabled()) return;

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title,
  });
}

// Event tracking types
type EventCategory =
  | "engagement"
  | "conversion"
  | "navigation"
  | "error";

interface TrackEventParams {
  action: string;
  category: EventCategory;
  label?: string;
  value?: number;
  // Additional custom parameters
  [key: string]: unknown;
}

// Track custom events
export function trackEvent({
  action,
  category,
  label,
  value,
  ...customParams
}: TrackEventParams): void {
  if (!isAnalyticsEnabled()) return;

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
    ...customParams,
  });
}

// Predefined event helpers for common actions

// CTA click tracking
export function trackCtaClick(ctaName: string, location: string): void {
  trackEvent({
    action: "cta_click",
    category: "conversion",
    label: ctaName,
    cta_location: location,
  });
}

// Pricing section view
export function trackPricingView(): void {
  trackEvent({
    action: "pricing_view",
    category: "engagement",
    label: "pricing_section",
  });
}

// Stripe redirect (before going to payment)
export function trackStripeRedirect(plan: string): void {
  trackEvent({
    action: "stripe_redirect",
    category: "conversion",
    label: plan,
  });
}

// Registration complete
export function trackRegistrationComplete(method?: string): void {
  trackEvent({
    action: "registration_complete",
    category: "conversion",
    label: method || "standard",
  });
}

// Blog post read
export function trackBlogRead(slug: string, title: string): void {
  trackEvent({
    action: "blog_read",
    category: "engagement",
    label: title,
    blog_slug: slug,
  });
}

// Newsletter signup
export function trackNewsletterSignup(location: string): void {
  trackEvent({
    action: "newsletter_signup",
    category: "conversion",
    label: location,
  });
}

// Error tracking
export function trackError(errorType: string, errorMessage: string): void {
  trackEvent({
    action: "error",
    category: "error",
    label: errorType,
    error_message: errorMessage,
  });
}

// Scroll depth tracking (call at 25%, 50%, 75%, 100%)
export function trackScrollDepth(depth: 25 | 50 | 75 | 100, page: string): void {
  trackEvent({
    action: "scroll_depth",
    category: "engagement",
    label: page,
    value: depth,
  });
}

// Feature interaction
export function trackFeatureInteraction(featureName: string, action: string): void {
  trackEvent({
    action: "feature_interaction",
    category: "engagement",
    label: featureName,
    interaction_type: action,
  });
}
