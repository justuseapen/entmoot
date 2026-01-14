# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Entmoot is a full-stack family multi-scale planning platform (SaaS) that helps families coordinate daily planning, weekly/monthly/quarterly/annual reviews, SMART goal setting with AI coaching, and gamification features.

## Tech Stack

- **Backend:** Rails 7.2 API-mode, Ruby 3.4.4, PostgreSQL 16, Redis 7, Sidekiq
- **Frontend:** React 19, TypeScript (strict), Vite 7, Tailwind CSS 4, shadcn/ui
- **Auth:** Devise + devise-jwt (24h access tokens, 30-day refresh tokens)
- **Authorization:** Pundit policies
- **AI:** Anthropic Claude API (via anthropic gem)
- **Error Tracking:** Glitchtip (Sentry-compatible)
- **State:** TanStack Query (server), Zustand (client)

## Commands

### Backend (run from `/backend`)

```bash
docker-compose up -d                    # Start PostgreSQL + Redis
bundle exec rails db:migrate            # Run migrations
bundle exec rails s -p 3000             # Start dev server
bundle exec sidekiq                     # Start background worker
bundle exec rspec                       # Run all tests
bundle exec rspec spec/requests/        # Run request specs only
bundle exec rspec spec/path_spec.rb     # Run single test file
bundle exec rubocop                     # Lint check
bundle exec rubocop -A                  # Auto-fix lint issues
```

### Frontend (run from `/frontend`)

```bash
PATH="$HOME/.asdf/shims:$PATH" npm run dev      # Start dev server (port 5173)
PATH="$HOME/.asdf/shims:$PATH" npm run build    # TypeScript check + build
PATH="$HOME/.asdf/shims:$PATH" npm test         # Run tests (watch mode)
PATH="$HOME/.asdf/shims:$PATH" npm run test:run # Run tests once
PATH="$HOME/.asdf/shims:$PATH" npm run lint     # ESLint check
PATH="$HOME/.asdf/shims:$PATH" npm run lint -- --fix  # Auto-fix + Prettier
PATH="$HOME/.asdf/shims:$PATH" npx shadcn@latest add <component>  # Add shadcn component
```

## Architecture

### Backend Structure

- `app/controllers/api/v1/` - RESTful API endpoints (all routes under `/api/v1/`)
- `app/models/` - ActiveRecord models (User, Family, FamilyMembership, Goal, Reflection, etc.)
- `app/policies/` - Pundit authorization policies (one per model)
- `app/services/` - Business logic services (e.g., GoalRefinementService for AI)
- `app/jobs/` - Sidekiq background jobs
- `spec/requests/` - Primary test location (request specs)
- `spec/support/auth_helpers.rb` - Use `auth_headers(user)` for authenticated test requests

### Frontend Structure

- `src/components/ui/` - shadcn/ui primitive components
- `src/pages/` - Page-level route components
- `src/stores/` - Zustand state stores
- `src/hooks/` - Custom React hooks
- `src/lib/api.ts` - API client and QueryClient setup

### Key Patterns

- **Path alias:** Use `@/` for imports from `src/` (e.g., `@/components/ui/button`)
- **API proxy:** Dev server proxies `/api` requests to Rails backend on port 3000
- **JWT auth:** Use `Warden::JWTAuth::UserEncoder` for token generation in tests
- **Roles:** User roles are `admin`, `adult`, `teen`, `child`, `observer`
- **Multi-family:** Users can belong to multiple families via `FamilyMembership` join model

## Code Style

### Ruby/Rails

- All files start with `# frozen_string_literal: true`
- Use double quotes for strings
- Prefer `:unprocessable_content` over `:unprocessable_entity` (Rack deprecation)
- Use `Time.zone.at()` for timezone-aware timestamps
- Custom validation messages go in `config/locales/en.yml`

### TypeScript/React

- Strict TypeScript mode enabled
- Use `ReturnType<typeof setTimeout>` instead of `NodeJS.Timeout`
- Prettier auto-sorts Tailwind classes

## Development Workflow

1. Backend API runs on `localhost:3000`
2. Frontend dev server runs on `localhost:5173` (proxies `/api` to backend)
3. Implement backend API first, then frontend UI
4. Request specs are the primary backend test type
5. Commit format: `feat: [US-XXX] - Story Title`

## Key Implementation Details

- **ActionCable WebSocket auth:** Pass JWT token as query param `?token=...`
- **NotificationService:** Handles both DB persistence and WebSocket broadcast
- **Anthropic gem:** Uses Faraday errors, not custom error classes
- **Rack::Attack:** Rate limiting configured in initializer, middleware in `config/application.rb`
- **Factory Bot:** Set auto-generated attributes (token, expires_at) to avoid nil issues with `build`
