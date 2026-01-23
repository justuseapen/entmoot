# Ralph Agent Instructions - Entmoot Mobile

You are an autonomous coding agent working on the Entmoot Mobile app - a React Native iOS app for family multi-scale planning.

## Your Task

1. Read the PRD at `mobile/prd.json`
2. Read the progress log at `mobile/progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from master.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks (typecheck, lint - as applicable)
7. Update AGENTS.md files if you discover reusable patterns (see below)
8. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
9. Update the PRD to set `passes: true` for the completed story
10. Append your progress to `mobile/progress.txt`

## Progress Report Format

APPEND to progress.txt (never replace, always append):

```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "this codebase uses X for Y")
  - Gotchas encountered (e.g., "don't forget to update Z when changing W")
  - Useful context (e.g., "the component is in directory X")
---
```

The learnings section is critical—it helps future iterations avoid repeating mistakes and understand the codebase better.

## Consolidate Patterns

If you discover a **reusable pattern** that future iterations should know, add it to the `## Codebase Patterns` section at the TOP of progress.txt (create it if it doesn't exist). This section should consolidate the most important learnings:

```
## Codebase Patterns
- Example: Use expo-secure-store for sensitive data, MMKV for caching
- Example: Always run `npx tsc --noEmit` before committing
- Example: Use @/ path alias for imports from src/
```

Only add patterns that are **general and reusable**, not story-specific details.

## Update AGENTS.md Files

Before committing, check if any edited files have learnings worth preserving in nearby AGENTS.md files:

1. **Identify directories with edited files** - Look at which directories you modified
2. **Check for existing AGENTS.md** - Look for AGENTS.md in those directories or parent directories
3. **Add valuable learnings** - If you discovered something future developers/agents should know:
   - API patterns or conventions specific to that module
   - Gotchas or non-obvious requirements
   - Dependencies between files
   - Testing approaches for that area
   - Configuration or environment requirements

**Examples of good AGENTS.md additions:**
- "When modifying X, also update Y to keep them in sync"
- "This module uses pattern Z for all API calls"
- "Tests require the dev server running on PORT 3000"
- "Field names must match the template exactly"

**Do NOT add:**
- Story-specific implementation details
- Temporary debugging notes
- Information already in progress.txt

Only update AGENTS.md if you have **genuinely reusable knowledge** that would help future work in that directory.

## Tech Stack

This mobile app uses:
- **Framework:** React Native with Expo SDK (managed workflow)
- **Navigation:** expo-router (file-based routing in app/ directory)
- **UI:** react-native-paper for components
- **State:** zustand for client state, @tanstack/react-query for server state
- **Storage:** expo-secure-store for auth tokens, react-native-mmkv for offline caching
- **Auth:** Session-based authentication with the Rails backend
- **Backend API:** Rails 7 at http://localhost:3000/api/v1 (already exists)

## Project Structure

```
mobile/
├── app/                    # expo-router screens (file-based routing)
│   ├── (auth)/            # Auth screens (login, register, forgot-password)
│   ├── (tabs)/            # Main tab screens (today, goals, me)
│   ├── goal/              # Goal detail/create screens
│   ├── onboarding/        # Onboarding flow screens
│   ├── reflection/        # Reflection screens
│   ├── settings/          # Settings screens
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable components
│   │   └── ui/           # Design system primitives
│   ├── hooks/            # Custom React hooks (data fetching)
│   ├── lib/              # API client, utilities
│   ├── services/         # Platform services (notifications, storage)
│   ├── stores/           # Zustand stores
│   └── theme/            # Colors, typography
├── assets/               # Images, icons, fonts
├── prd.json             # User stories for Ralph
├── progress.txt         # Progress log for Ralph
└── ralph.sh             # This script
```

## Quality Requirements

- ALL commits must pass quality checks
- Run `npx tsc --noEmit` for typecheck (required)
- Run `npm run lint` for linting (if configured)
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns

## Key Commands

```bash
# From mobile/ directory
npx expo start                 # Start dev server
npx tsc --noEmit              # TypeScript check (REQUIRED before commit)
npm run lint                   # ESLint (if configured)
npm test                       # Jest tests (if configured)
npx expo install <package>     # Install Expo-compatible packages
```

## Backend API Reference

The Rails backend is already complete. Key endpoints:
- Auth: POST /api/v1/auth/login, /register, /logout, GET /auth/me
- Families: GET/POST /api/v1/families, GET /families/:id/members
- Daily Plans: GET /families/:id/daily_plans/today, PATCH /families/:id/daily_plans/:id
- Habits: GET/POST/PATCH/DELETE /families/:id/habits
- Goals: GET/POST/PATCH/DELETE /families/:id/goals, POST /goals/:id/refine
- Reflections: GET/POST/PATCH /families/:id/reflections
- Reviews: GET /families/:id/weekly_reviews/current
- Notifications: GET /notifications, POST /device_tokens
- User: GET /users/me/points, /users/me/streaks, /users/me/badges

Check backend/app/controllers/api/v1/ for full endpoint documentation.

## Simulator Testing (Required for UI Stories)

For any story that changes UI, you MUST verify it works:

1. Start the Expo dev server: `npx expo start`
2. Press `i` to open iOS Simulator
3. Verify the UI changes work as expected
4. Note any issues in progress.txt

A UI story is NOT complete until simulator verification passes.

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally (another iteration will pick up the next story).

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep typecheck passing
- Read the Codebase Patterns section in progress.txt before starting
- Use `npx expo install` instead of `npm install` for React Native packages
