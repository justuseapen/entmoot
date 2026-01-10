# Entmoot - Agent Instructions

This is the root-level AGENTS.md for the Entmoot project.

## Project Overview

Entmoot is a family multi-scale planning platform that helps families coordinate:
- Daily planning and nightly reflection
- Weekly, monthly, quarterly, and annual reviews
- SMART goal setting with AI coaching
- Gamification (streaks, badges, points, leaderboards)

## Tech Stack

- **Backend:** Rails 7.1+ API mode in `/backend`
- **Frontend:** React 18 + TypeScript + Vite in `/frontend`
- **Database:** PostgreSQL
- **Cache/Jobs:** Redis + Sidekiq
- **AI:** Anthropic Claude API

## Key Conventions

### Backend (Rails)

- API-only mode with JSON responses
- Versioned API under `/api/v1/`
- Use Devise + devise-jwt for authentication
- Use Pundit for authorization
- Use RSpec for testing (request specs are primary)
- Follow Rails conventions for naming

### Frontend (React)

- TypeScript strict mode enabled
- TanStack Query for server state
- Zustand for client state
- Tailwind CSS for styling
- shadcn/ui for component primitives
- React Router v6 for routing

### Testing

- Backend: `bundle exec rspec`
- Frontend: `npm test` (in `/frontend`)
- All PRs must have passing tests

### Development

- Backend runs on `localhost:3000`
- Frontend runs on `localhost:5173` with proxy to backend
- Docker Compose available for PostgreSQL and Redis

## File Structure

```
/backend        - Rails API application
/frontend       - React SPA
/prd.json       - User stories for Ralph
/progress.txt   - Ralph iteration log
/ralph.sh       - Ralph orchestration script
/prompt.md      - Ralph agent instructions
```

## Adding New Features

1. Check `prd.json` for the current story
2. Implement backend API first (if needed)
3. Add request specs for new endpoints
4. Implement frontend components
5. Add component tests
6. Verify in browser using dev-browser skill
7. Commit with message: `feat: [US-XXX] - Title`
