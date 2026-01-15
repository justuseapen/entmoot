# PRD: Daily Focus Card Redesign

## Introduction

Redesign the Daily Planner to match the user's "Daily Focus Card Template" which provides a more focused, structured approach to daily planning. The new design emphasizes:
- Top 3 outcomes tied to weekly goals
- A habit/non-negotiables tracker for recurring daily practices
- Structured shutdown notes for end-of-day reflection

## Goals

- Replace the current freeform daily planner with a structured daily focus card
- Connect daily outcomes explicitly to weekly/longer-term goals
- Provide a persistent habit tracker with preset non-negotiables
- Add structured shutdown notes with specific prompts ("What shipped?", "What blocked me?")
- Maintain the existing auto-save and drag-and-drop UX patterns

## User Stories

### US-001: Create Habit model and migration
**Description:** As a developer, I need to store habit definitions and daily completion status.

**Acceptance Criteria:**
- [ ] Create `habits` table with: name, position, user_id, family_id, is_active (default true)
- [ ] Create `habit_completions` table with: habit_id, daily_plan_id, completed (boolean), timestamps
- [ ] Add associations: Habit has_many :habit_completions, DailyPlan has_many :habit_completions
- [ ] Run migration successfully
- [ ] Typecheck passes

### US-002: Seed default habits for users
**Description:** As a user, I want preset habits available when I first use the daily planner.

**Acceptance Criteria:**
- [ ] Create service to initialize default habits for a user/family: Prayer AM, Bible Study, Planning, Workout, Walk, Writing, Reading, House Reset, Prayer PM
- [ ] Call service when creating first daily plan for a user
- [ ] Habits are ordered by position
- [ ] Typecheck passes

### US-003: Add habits API endpoints
**Description:** As a developer, I need API endpoints to manage habits and completions.

**Acceptance Criteria:**
- [ ] GET /api/v1/families/:family_id/habits - list user's habits
- [ ] PATCH /api/v1/families/:family_id/daily_plans/:id - accept habit_completions_attributes for nested updates
- [ ] Habit completions created/updated when daily plan is saved
- [ ] Pundit authorization ensures users can only modify their own habits
- [ ] Typecheck passes

### US-004: Add shutdown_notes to daily_plans
**Description:** As a user, I need to record structured shutdown notes at end of day.

**Acceptance Criteria:**
- [ ] Add `shutdown_shipped` (text) and `shutdown_blocked` (text) columns to daily_plans table
- [ ] Update daily_plans_controller to permit these new fields
- [ ] Run migration successfully
- [ ] Typecheck passes

### US-005: Update frontend types for habits and shutdown notes
**Description:** As a developer, I need TypeScript types for the new data structures.

**Acceptance Criteria:**
- [ ] Add Habit and HabitCompletion types to dailyPlans.ts
- [ ] Add shutdown_shipped and shutdown_blocked to DailyPlan type
- [ ] Add useHabits hook for fetching habits
- [ ] Update useDailyPlans to include habit_completions in responses
- [ ] Typecheck passes

### US-006: Redesign Top 3 Outcomes section
**Description:** As a user, I want my Top 3 outcomes to be explicitly linked to weekly goals.

**Acceptance Criteria:**
- [ ] Rename "Top 3 Priorities" card to "Top 3 Outcomes Today"
- [ ] Add subtitle: "What specific tasks drive your weekly plan forward?"
- [ ] Add goal selector dropdown to each outcome (filter to weekly+ goals)
- [ ] Show linked goal badge next to each outcome
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Build Non-Negotiables habit tracker UI
**Description:** As a user, I want a checklist of my daily habits to track completion.

**Acceptance Criteria:**
- [ ] Add new Card section titled "Non-Negotiables" between Top 3 Outcomes and Today's Tasks
- [ ] Display habits as checkboxes in a 2-3 column grid layout
- [ ] Clicking checkbox toggles completion and auto-saves
- [ ] Show completion count (e.g., "7/9 complete")
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Build Shutdown Notes UI section
**Description:** As a user, I want structured prompts for end-of-day reflection.

**Acceptance Criteria:**
- [ ] Replace "Daily Intention" card with "Shutdown Notes" card
- [ ] Add two textarea fields with prompts: "What shipped today?" and "What blocked me?"
- [ ] Auto-save on blur like other fields
- [ ] Position at bottom of daily planner (before navigation)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Remove Daily Tasks section
**Description:** As a user, I want a cleaner daily focus card without the general tasks list.

**Acceptance Criteria:**
- [ ] Remove the "Today's Tasks" card from DailyPlanner.tsx
- [ ] Remove the "Yesterday's Unfinished Tasks" card
- [ ] Remove the Progress indicator (task completion percentage)
- [ ] Keep existing DailyTask model/API for backwards compatibility
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Update daily planner header and styling
**Description:** As a user, I want the daily focus card to look clean and focused.

**Acceptance Criteria:**
- [ ] Update header subtitle to "Daily Focus Card"
- [ ] Adjust card spacing for new layout (outcomes, habits, shutdown notes)
- [ ] Ensure mobile responsive layout
- [ ] Keep Save status bar functionality
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Create `habits` table with name, position, user_id, family_id, is_active columns
- FR-2: Create `habit_completions` table linking habits to daily_plans with completed status
- FR-3: Initialize 9 default habits (Prayer AM, Bible Study, Planning, Workout, Walk, Writing, Reading, House Reset, Prayer PM) for new users
- FR-4: Add GET /api/v1/families/:id/habits endpoint
- FR-5: Extend PATCH /api/v1/families/:id/daily_plans/:id to accept habit_completions_attributes
- FR-6: Add shutdown_shipped and shutdown_blocked text columns to daily_plans
- FR-7: Display Top 3 Outcomes with goal linkage UI
- FR-8: Display Non-Negotiables as checkbox grid
- FR-9: Display Shutdown Notes with two prompted textareas
- FR-10: Remove Daily Tasks and Yesterday's Tasks sections from UI

## Non-Goals

- No habit customization UI (adding/removing/reordering habits) - use preset list only
- No habit streaks or statistics tracking
- No changes to the existing Evening Reflection or Weekly Review features
- No changes to the Goals system (just linking from outcomes)
- No archiving or history view for past daily plans

## Technical Considerations

- Reuse existing auto-save pattern with localState and saveChanges callback
- Use nested attributes pattern for habit_completions (like daily_tasks_attributes)
- Filter goals dropdown to show only weekly/monthly/quarterly/annual goals (not daily)
- Maintain backwards compatibility - don't delete daily_tasks table/API

## Success Metrics

- Daily planner matches the Daily Focus Card template layout
- All habits save/load correctly across sessions
- Shutdown notes persist and are associated with correct daily plan
- No regression in existing daily planner functionality (for users who have existing data)

## Open Questions

- Should habits be user-specific or shared across family members? (Assuming user-specific for now)
- Should we allow habit customization in a future iteration?
