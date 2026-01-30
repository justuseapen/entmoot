# Entmoot v2: Daily Focus Card

**Date:** 2026-01-30
**Status:** Approved

## Problem

The founding family currently uses a shared Apple Note template for daily planning. Each morning, the template is manually copied, configured with the day's tasks, and shared with the spouse. The wife has a separate cleaning checklist with subtasks grouped by time of day (Morning, Daytime, Evening).

Entmoot already has most of the underlying data model (DailyPlan, DailyTask, TopPriority, Habit, HabitCompletion) but the UX is cluttered with features beyond daily planning (goals, reflections, gamification, weekly/monthly reviews) and is missing key functionality (habit subtasks, spouse peek).

## Solution

Strip Entmoot down to a single, focused experience: the Daily Focus Card. Remove all non-essential features from the codebase. Add habit subtasks and a spouse peek drawer. Make the Focus Card the only screen that matters.

**Success criteria:** A couple opens Entmoot each morning instead of Apple Notes. They check off habits and tasks throughout the day. They can peek at each other's progress with one tap.

## Scope

### Keep
- Daily Plans (Focus Card) with auto-creation via `/today` endpoint
- Top 3 Priorities per day
- Daily Tasks (ordered, checkable)
- Habits with completions (enhanced with subtasks)
- Shutdown Notes (shipped/blocked)
- Family membership and sharing (Pundit policies)
- User auth (Devise + JWT, Google OAuth)
- WebSocket notifications (ActionCable)
- Auto-save on all changes

### Add
- Habit subtasks (expandable checklist within a habit)
- Spouse peek drawer (read-only view of spouse's Focus Card)
- Habit management screen (add/edit/reorder habits and subtasks)

### Remove (from codebase entirely)
- Goals system (Goal model, controller, policies, GoalRefinementService)
- Reflections system (Reflection, ReflectionResponse, ReflectionPrompt)
- Gamification (PointAward, Badge, UserBadge, streaks)
- AI coaching (Anthropic integration, GoalRefinementService)
- Calendar sync (Google Calendar integration)
- Activity feed
- Dashboard page (replaced by Focus Card as landing page)
- Evening Reflection wizard page
- Weekly/Monthly/Quarterly/Annual review pages
- Reminders system
- `goal_id` foreign key on DailyTask and TopPriority
- `assignee_id` foreign key on DailyTask

## Data Model

### Existing models (no changes)
- `User` - auth, profile
- `Family` - family unit
- `FamilyMembership` - join model (user + family + role)
- `DailyPlan` - one per user per family per date. Fields: `date`, `intention`, `shutdown_shipped`, `shutdown_blocked`, `user_id`, `family_id`
- `TopPriority` - max 3 per plan. Fields: `title`, `priority_order`, `completed`, `daily_plan_id`
- `Habit` - user's recurring habits. Fields: `name`, `position`, `is_active`, `user_id`, `family_id`
- `HabitCompletion` - daily completion. Fields: `completed`, `habit_id`, `daily_plan_id`

### Modified models
- `DailyTask` - remove `goal_id` and `assignee_id` columns. Keep: `title`, `completed`, `position`, `daily_plan_id`

### New models

**HabitSubtask**
```
habit_subtasks
  id            bigint PK
  habit_id      bigint FK -> habits (NOT NULL)
  title         string (NOT NULL)
  position      integer (NOT NULL, default: 0)
  created_at    timestamp
  updated_at    timestamp

  index: [habit_id, position]
```

**HabitSubtaskCompletion**
```
habit_subtask_completions
  id                  bigint PK
  habit_subtask_id    bigint FK -> habit_subtasks (NOT NULL)
  daily_plan_id       bigint FK -> daily_plans (NOT NULL)
  completed           boolean (NOT NULL, default: false)
  created_at          timestamp
  updated_at          timestamp

  unique index: [habit_subtask_id, daily_plan_id]
```

### Associations
- `Habit` has_many `:habit_subtasks`, dependent: :destroy
- `HabitSubtask` belongs_to `:habit`
- `HabitSubtask` has_many `:habit_subtask_completions`, dependent: :destroy
- `HabitSubtaskCompletion` belongs_to `:habit_subtask`
- `HabitSubtaskCompletion` belongs_to `:daily_plan`
- `DailyPlan` has_many `:habit_subtask_completions`

### Auto-completion behavior
When all subtask completions for a habit are marked `completed: true` for a given daily plan, the parent `HabitCompletion` is automatically marked `completed: true`. Conversely, if any subtask is unchecked, the parent is marked `completed: false`.

This logic lives in the `HabitSubtaskCompletion` model as an `after_save` callback that checks sibling completion status and updates the parent `HabitCompletion`.

## UX Design

### Navigation (simplified)
- `/` -> redirects to `/families/{id}/planner` (today's Focus Card)
- `/families/{id}/planner` -> Daily Focus Card (the main and only daily screen)
- `/families/{id}/habits` -> Habit Management screen
- `/settings` -> Account settings

### Daily Focus Card layout

```
+-------------------------------------+
|  [< prev]   Jan 30, 2026   [next >] |
|         Daily Focus Card             |
|                    [Spouse peek btn] |
+-------------------------------------+
|                                      |
|  TOP 3 OUTCOMES TODAY                |
|  [ ] ______________________________  |
|  [ ] ______________________________  |
|  [ ] ______________________________  |
|                                      |
+-------------------------------------+
|                                      |
|  NON-NEGOTIABLES [gear]     7/9      |
|  [x] Prayer AM                       |
|  [ ] Bible Study                     |
|  [ ] Planning                        |
|  [ ] Workout                         |
|  [ ] Walk                            |
|  [ ] Writing                         |
|  [ ] Reading                         |
|  [>] House Reset            3/10     |
|      [x] Unload dishwasher           |
|      [x] Make beds                   |
|      [ ] Quick bathroom wipe         |
|      ...                             |
|  [ ] Prayer PM                       |
|                                      |
+-------------------------------------+
|                                      |
|  TASKS                               |
|  [ ] Call dentist                    |
|  [ ] Submit expense report           |
|  [+ Add task]                        |
|                                      |
+-------------------------------------+
|                                      |
|  SHUTDOWN NOTES                      |
|  What shipped: ________________      |
|  What blocked: ________________      |
|                                      |
+-------------------------------------+
```

### Key interactions

**Expandable habits:** Habits with subtasks show a chevron and sub-counter (e.g., "3/10"). Tap chevron to expand/collapse. Each subtask is independently checkable. Parent auto-completes when all subtasks are done.

**Spouse peek:** Button in the header area. Tapping it opens a slide-in drawer from the right showing the spouse's Focus Card for today (read-only). Dismiss by swiping or tapping outside. WebSocket notification when spouse completes items.

**Gear icon:** Opens the Habit Management screen (`/families/{id}/habits`).

**Auto-save:** All changes (checkbox toggles, text edits) auto-save immediately. Status indicator shows save state.

**Past days:** Arrow navigation shows previous days in read-only mode.

### Habit Management screen

```
+-------------------------------------+
|  [< Back]       My Habits            |
+-------------------------------------+
|                                      |
|  = Prayer AM                    [e]  |
|  = Bible Study                  [e]  |
|  = Planning                     [e]  |
|  = Workout                      [e]  |
|  = Walk                         [e]  |
|  = Writing                      [e]  |
|  = Reading                      [e]  |
|  = House Reset (10 subtasks)    [e]  |
|  = Prayer PM                    [e]  |
|                                      |
|  [+ Add Habit]                       |
|                                      |
+-------------------------------------+
```

- Drag handles for reordering (existing dnd-kit)
- Edit button opens modal with: rename, active toggle, subtask management, delete
- Subtask editor within modal: add, reorder (drag), rename, delete subtasks

### Habit edit modal (with subtasks)

```
+-------------------------------------+
|  Edit: House Reset              [x]  |
+-------------------------------------+
|                                      |
|  Name: [House Reset            ]     |
|  Active: [toggle on]                 |
|                                      |
|  SUBTASKS                            |
|  = Unload dishwasher            [x]  |
|  = Make beds                    [x]  |
|  = Breakfast cleanup            [x]  |
|  = One load of laundry          [x]  |
|  = Quick bathroom wipe          [x]  |
|  = Floors: vacuum/sweep         [x]  |
|  = 15-min house straighten      [x]  |
|  = Trash checked                [x]  |
|  = Kitchen counters wiped       [x]  |
|  = Dishes/dishwasher running    [x]  |
|                                      |
|  [+ Add Subtask]                     |
|                                      |
|  [Delete Habit]                      |
+-------------------------------------+
```

## API Changes

### New endpoints

**Habit Subtasks** (nested under habits):
- `GET /api/v1/families/{family_id}/habits/{habit_id}/subtasks` - list subtasks
- `POST /api/v1/families/{family_id}/habits/{habit_id}/subtasks` - create subtask
- `PATCH /api/v1/families/{family_id}/habits/{habit_id}/subtasks/{id}` - update subtask
- `DELETE /api/v1/families/{family_id}/habits/{habit_id}/subtasks/{id}` - delete subtask
- `POST /api/v1/families/{family_id}/habits/{habit_id}/subtasks/update_positions` - reorder

**Subtask completions** (handled via daily plan update):
- Extend daily plan update to accept `habit_subtask_completions_attributes` (same nested attributes pattern as habit_completions)

**Spouse peek:**
- `GET /api/v1/families/{family_id}/daily_plans/spouse_today` - returns spouse's today plan (read-only)

### Modified endpoints
- Daily plan `show` and `today` responses now include `habit_subtask_completions` nested within `habit_completions`

### Removed endpoints
- All goals endpoints
- All reflections endpoints
- Gamification endpoints (points, badges, streaks)
- Reminders endpoints
- Calendar sync endpoints

## Implementation Phases

### Phase 1: Strip down
- Remove Goals, Reflections, Gamification, Calendar Sync, AI Coaching, Reminders from backend (models, controllers, policies, services, jobs, specs)
- Remove corresponding frontend pages, components, hooks, API calls
- Remove `goal_id` from DailyTask and TopPriority (migration)
- Remove `assignee_id` from DailyTask (migration)
- Simplify routes and navigation
- Drop removed database tables
- Verify app still works end-to-end

### Phase 2: Habit subtasks (backend)
- Create HabitSubtask model + migration
- Create HabitSubtaskCompletion model + migration
- Add associations and validations
- Update HabitInitializerService to create subtask completions
- Add subtask CRUD controller (nested under habits)
- Add subtask positions update endpoint
- Update daily plan serialization to include subtask completions
- Add auto-completion callback on HabitSubtaskCompletion
- Add spouse_today endpoint
- Pundit policies for new models
- Request specs for all new behavior

### Phase 3: Focus Card frontend refinements
- Make Focus Card the landing page (replace dashboard)
- Add expandable habit subtask UI (chevron, sub-counter, nested checkboxes)
- Wire subtask completion API calls with auto-save
- Add spouse peek drawer (slide-in, read-only)
- WebSocket notification on spouse activity

### Phase 4: Habit management screen
- Create habits management page at `/families/{id}/habits`
- Extend HabitModal to include subtask CRUD
- Drag-and-drop for subtask reordering (reuse dnd-kit)
- Add gear icon link on Focus Card Non-Negotiables header
- Wire up all API calls

### Phase 5: Polish
- Mobile responsiveness pass
- Loading states, error handling, empty states
- First-time user experience (create habits on first visit)
- Performance optimization (ensure Focus Card loads fast)
