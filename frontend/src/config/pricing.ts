/**
 * Pricing and Payment Configuration
 *
 * Central config for all pricing-related constants.
 * Update STRIPE_PAYMENT_LINK when you create a new payment link.
 */

// Stripe Payment Link URL
export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/5kQdR98CTdRQ88f5rkcZa00";

// Pricing
export const FOUNDING_FAMILY_PRICE = 249;
export const REGULAR_PRICE = 499;

// Formatted strings for display
export const PRICE_DISPLAY = `$${FOUNDING_FAMILY_PRICE}`;
export const REGULAR_PRICE_DISPLAY = `$${REGULAR_PRICE}`;

// Price comparison for marketing
export const PRICE_COMPARISON = {
  coziFamily: { annual: "$29/year", tenYear: "$290", entmoot: PRICE_DISPLAY },
  notionFamily: { annual: "$96/year", tenYear: "$960", entmoot: PRICE_DISPLAY },
  todoistPremium: { annual: "$48/year", tenYear: "$480", entmoot: PRICE_DISPLAY },
};
