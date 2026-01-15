# PRD: Better Error Messaging & HeyDev Feedback Widget

## Introduction

Improve the user experience by replacing generic error messages ("API error: 422") with friendly, actionable messages that help users understand what went wrong and how to fix it. Additionally, integrate the HeyDev feedback widget to allow users to easily report issues and provide feedback directly from the app.

## Goals

- Replace all generic error messages with user-friendly, contextual messages
- Provide actionable suggestions for common errors (e.g., "Email already taken. Try signing in instead.")
- Standardize error response format across the backend API
- Integrate HeyDev widget for frictionless user feedback collection
- Enable automatic JS error capture via HeyDev (complementing Glitchtip)
- Give users a direct channel to communicate issues and suggestions

## User Stories

### US-001: Standardize backend error response format
**Description:** As a developer, I need a consistent error response format so the frontend can reliably parse and display errors.

**Acceptance Criteria:**
- [ ] All API errors return JSON with structure: `{ error: string, errors?: string[], code?: string, suggestion?: string }`
- [ ] Create `ErrorResponse` concern/module with helper methods for common error types
- [ ] `error` field contains user-friendly message, `errors` array for field-specific validation errors
- [ ] `suggestion` field provides actionable next step when applicable
- [ ] Typecheck/lint passes
- [ ] Existing tests still pass

### US-002: Add friendly error messages to authentication endpoints
**Description:** As a user, I want helpful error messages when registration or login fails so I know how to fix the problem.

**Acceptance Criteria:**
- [ ] Registration "email taken" error shows: "This email is already registered. Try signing in instead."
- [ ] Registration "password too short" shows: "Password must be at least 6 characters."
- [ ] Login "invalid credentials" shows: "Incorrect email or password. Please try again."
- [ ] Login "account not found" shows: "No account found with this email. Would you like to create one?"
- [ ] Password reset "email not found" shows: "We couldn't find an account with this email."
- [ ] Typecheck/lint passes

### US-003: Add friendly error messages to family/goal endpoints
**Description:** As a user, I want clear error messages when family or goal operations fail.

**Acceptance Criteria:**
- [ ] "Family not found" shows: "This family doesn't exist or you don't have access to it."
- [ ] "Goal not found" shows: "This goal doesn't exist or has been deleted."
- [ ] Goal validation errors show field-specific messages (e.g., "Title is required", "Due date must be in the future")
- [ ] AI refinement failure shows: "Our AI assistant is temporarily unavailable. Please try again in a few minutes."
- [ ] Typecheck/lint passes

### US-004: Add friendly error messages to invitation flow
**Description:** As a user, I want clear guidance when invitation acceptance fails.

**Acceptance Criteria:**
- [ ] Expired invitation shows: "This invitation has expired. Please ask for a new one."
- [ ] Already used invitation shows: "This invitation has already been used."
- [ ] Invalid token shows: "This invitation link is invalid. Please check the link or request a new invitation."
- [ ] Typecheck/lint passes

### US-005: Create frontend error message mapping utility
**Description:** As a developer, I need a utility to map API errors to user-friendly messages with suggestions.

**Acceptance Criteria:**
- [ ] Create `src/lib/errors.ts` with `getErrorMessage(error: unknown): { message: string, suggestion?: string }`
- [ ] Handles API errors (uses `error.message` and `error.suggestion` from API response)
- [ ] Handles network errors ("Unable to connect. Please check your internet connection.")
- [ ] Handles unknown errors with generic fallback ("Something went wrong. Please try again.")
- [ ] Typecheck passes

### US-006: Update API client to parse structured errors
**Description:** As a developer, I need the API client to properly parse the new error format.

**Acceptance Criteria:**
- [ ] Update `apiFetch` in `src/lib/api.ts` to throw custom `ApiError` class
- [ ] `ApiError` includes: `message`, `errors` array, `code`, `suggestion`, and `status`
- [ ] Preserve backward compatibility with old error format
- [ ] Typecheck passes

### US-007: Update registration form error display
**Description:** As a user, I want to see helpful error messages on the registration form.

**Acceptance Criteria:**
- [ ] Display field-specific errors next to relevant form fields
- [ ] Show suggestion text below the main error (e.g., "Try signing in instead" with link)
- [ ] Error messages styled consistently with app design (red text, appropriate spacing)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Update login form error display
**Description:** As a user, I want to see helpful error messages on the login form.

**Acceptance Criteria:**
- [ ] Display error message prominently above form
- [ ] Show suggestion with actionable link (e.g., "Create an account" link if account not found)
- [ ] Include "Forgot password?" link near error when credentials are wrong
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Update goal forms error display
**Description:** As a user, I want to see clear validation errors when creating or editing goals.

**Acceptance Criteria:**
- [ ] Field-specific errors appear next to each field
- [ ] AI refinement errors show retry option
- [ ] Toast notification for transient errors
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Sign up for HeyDev SaaS and obtain API key
**Description:** As a developer, I need HeyDev credentials to integrate the widget.

**Acceptance Criteria:**
- [ ] Create HeyDev account at heydev.io (or relevant SaaS URL)
- [ ] Create project for Entmoot
- [ ] Obtain API key for widget integration
- [ ] Document API key location in environment variables

### US-011: Add HeyDev widget script to frontend
**Description:** As a user, I want a feedback button available on all pages so I can easily report issues.

**Acceptance Criteria:**
- [ ] Add HeyDev script tag to `index.html` with API key from environment variable
- [ ] Widget loads on all pages (floating button in bottom-right corner)
- [ ] Widget respects app's color scheme (use `data-theme` attribute)
- [ ] Enable error tracking with `data-error-tracking="true"`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill - confirm widget appears and opens

### US-012: Configure HeyDev environment variables
**Description:** As a developer, I need HeyDev configuration in environment variables for different environments.

**Acceptance Criteria:**
- [ ] Add `VITE_HEYDEV_API_KEY` to frontend `.env.example`
- [ ] Add `VITE_HEYDEV_ENDPOINT` to frontend `.env.example` (if using self-hosted)
- [ ] Add to Coolify frontend environment variables
- [ ] Widget gracefully disabled if API key not present (no console errors)
- [ ] Typecheck passes

### US-013: Add user context to HeyDev feedback
**Description:** As a developer, I want feedback submissions to include user context so I can follow up.

**Acceptance Criteria:**
- [ ] Pass current user ID and email to HeyDev widget (if logged in)
- [ ] Include current page URL in feedback context
- [ ] Include app version in feedback context
- [ ] Anonymous feedback allowed for logged-out users
- [ ] Typecheck passes

## Functional Requirements

### Error Messaging
- FR-1: All API error responses must include a user-friendly `error` message field
- FR-2: Validation errors must include an `errors` array with field-specific messages
- FR-3: Actionable errors must include a `suggestion` field with next steps
- FR-4: Frontend must display error messages prominently near the relevant action/form
- FR-5: Frontend must display suggestions with actionable links where applicable
- FR-6: Network errors must show connection-specific messaging

### HeyDev Integration
- FR-7: HeyDev widget must appear on all authenticated pages as floating button
- FR-8: Widget must support voice and text feedback input
- FR-9: Widget must automatically capture JavaScript errors when enabled
- FR-10: Feedback must include user context (ID, email) when available
- FR-11: Widget must be configurable via environment variables
- FR-12: Widget must not break if HeyDev service is unavailable

## Non-Goals

- Custom HeyDev dashboard (use HeyDev SaaS dashboard)
- Self-hosting HeyDev (using SaaS)
- Bi-directional chat (HeyDev handles this in their dashboard)
- Error message internationalization/i18n (English only for now)
- Custom error pages (404, 500) - just API error messaging
- Email notifications from HeyDev (configure in HeyDev dashboard separately)

## Design Considerations

- Error messages should use warm, helpful tone (not technical or blaming)
- Suggestions should be actionable with clear next steps
- Field-specific errors should appear inline, near the field
- General errors should appear in a dismissible alert/toast
- HeyDev widget uses its default styling but should match dark/light theme

### Error Message Tone Examples
| Bad | Good |
|-----|------|
| "Validation failed" | "Please fix the highlighted fields" |
| "Record not found" | "This item doesn't exist or has been deleted" |
| "Unauthorized" | "Please sign in to continue" |
| "Email has already been taken" | "This email is already registered. Try signing in instead." |

## Technical Considerations

- Backend: Create `Api::ErrorResponse` concern for consistent error formatting
- Frontend: Create `ApiError` class extending `Error` with typed properties
- Frontend: HeyDev script loaded via `<script>` tag with environment variables
- HeyDev widget uses Shadow DOM so won't conflict with app styles
- Consider lazy-loading HeyDev script to not impact initial page load

## Success Metrics

- Zero instances of "API error: [status]" shown to users
- All validation errors show field-specific, actionable messages
- HeyDev widget accessible from any page in the app
- User feedback submissions visible in HeyDev dashboard
- No increase in error-related support requests

## Open Questions

- Should we show error codes for support reference? (Decided: No, keep it simple)
- Should HeyDev widget be hidden during onboarding? (Suggest: Show on all pages)
- What's the HeyDev SaaS URL/signup process? (Need to verify availability)
