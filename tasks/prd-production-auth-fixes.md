# PRD: Production Authentication & WebSocket Fixes

## Introduction

After deploying the JWT-to-session auth migration, production is experiencing critical failures:
1. All API requests return 401 (Unauthorized) - session cookies not being sent cross-origin
2. WebSocket connections fail - ActionCable still expects JWT tokens
3. 404 on tour_preferences - likely due to auth failure, not missing endpoint

Root cause: Cross-subdomain cookie configuration and incomplete ActionCable migration.

## Goals

- Fix cross-origin session cookie authentication between `entmoot.app` and `api.entmoot.app`
- Update ActionCable to use session-based authentication instead of JWT
- Ensure all API requests work correctly in production
- Add regression tests to prevent future auth failures

## User Stories

### US-001: Fix session cookie domain configuration
**Description:** As a user, I need my login session to work across subdomains so API requests are authenticated.

**Acceptance Criteria:**
- [ ] Add `domain: :all` to session cookie configuration to share cookies across subdomains
- [ ] Change `same_site: :lax` to `same_site: :none` for cross-origin cookie sending
- [ ] Verify cookies include proper domain in development and production
- [ ] Typecheck passes

### US-002: Update ActionCable connection for session auth
**Description:** As a developer, I need ActionCable to authenticate via session cookies instead of JWT tokens.

**Acceptance Criteria:**
- [ ] Remove JWT token decoding from `connection.rb`
- [ ] Use `request.session` and `env['warden']` to get authenticated user
- [ ] Handle case where no session exists (reject connection)
- [ ] Typecheck passes

### US-003: Add CORS expose headers for cookies
**Description:** As a developer, I need CORS to properly expose Set-Cookie headers for session management.

**Acceptance Criteria:**
- [ ] Add `expose: ['Set-Cookie']` to CORS configuration
- [ ] Verify CORS preflight requests succeed in production
- [ ] Typecheck passes

### US-004: Add request spec for cross-origin session auth
**Description:** As a developer, I need regression tests to verify session auth works correctly.

**Acceptance Criteria:**
- [ ] Add spec testing that session cookie is set on login
- [ ] Add spec testing that session cookie authenticates subsequent requests
- [ ] Add spec testing logout clears session
- [ ] All tests pass
- [ ] Typecheck passes

### US-005: Add ActionCable connection spec for session auth
**Description:** As a developer, I need tests verifying ActionCable authenticates via sessions.

**Acceptance Criteria:**
- [ ] Add spec testing connection with valid session succeeds
- [ ] Add spec testing connection without session is rejected
- [ ] All tests pass
- [ ] Typecheck passes

### US-006: Update frontend WebSocket to handle reconnection
**Description:** As a user, I need WebSocket to gracefully handle authentication state changes.

**Acceptance Criteria:**
- [ ] WebSocket reconnects when auth state changes
- [ ] WebSocket disconnects cleanly on logout
- [ ] No stale connection attempts after logout
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Session cookies MUST be shared across `*.entmoot.app` subdomains using `domain: :all`
- FR-2: Session cookies MUST use `same_site: :none` with `secure: true` for cross-origin requests
- FR-3: ActionCable MUST authenticate using the session cookie, not JWT tokens
- FR-4: CORS MUST include `credentials: true` and expose Set-Cookie headers
- FR-5: Frontend MUST include `credentials: 'include'` on all API requests (already done)
- FR-6: All authentication flows MUST have corresponding request specs

## Non-Goals

- Reverting to JWT authentication
- Supporting non-HTTPS in production
- Supporting browsers that don't handle SameSite=None cookies

## Technical Considerations

### Cookie Configuration
The session cookie needs these settings for cross-subdomain auth:
```ruby
config.middleware.use ActionDispatch::Session::CookieStore,
  key: "_entmoot_session",
  domain: :all,           # Shares across subdomains
  same_site: :none,       # Required for cross-origin
  secure: Rails.env.production?
```

### ActionCable Session Auth
Replace JWT decoding with Warden session lookup:
```ruby
def find_verified_user
  # Access the session from the request
  session = request.session
  user_id = session["warden.user.user.key"]&.first&.first

  return reject_unauthorized_connection unless user_id

  User.find_by(id: user_id) || reject_unauthorized_connection
end
```

### Critical Files to Modify
1. `backend/config/application.rb` - Cookie domain and same_site settings
2. `backend/app/channels/application_cable/connection.rb` - Session auth
3. `backend/config/initializers/cors.rb` - Expose headers
4. `backend/spec/requests/api/v1/auth/sessions_spec.rb` - Add regression tests
5. `backend/spec/channels/connection_spec.rb` - Add ActionCable tests
6. `frontend/src/hooks/useNotificationWebSocket.ts` - Handle reconnection

## Success Metrics

- All API requests return 200/201 for authenticated users in production
- WebSocket connections succeed and stay connected
- No 401 errors in production console for authenticated users
- All new regression tests pass

## Open Questions

None - root causes are identified and solutions are clear.
