# Entmoot v2 Implementation Brief: Daily Focus Card

**Date:** 2026-01-30
**Status:** Ready for execution
**Coordinated by:** Chief of Staff
**Source design:** `docs/plans/2026-01-30-daily-focus-card-v2-design.md`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Engineering Implementation Plan](#engineering-implementation-plan)
3. [QA Strategy](#qa-strategy)
4. [Marketing Launch Plan](#marketing-launch-plan)
5. [Cross-Team Dependencies](#cross-team-dependencies)
6. [Risk Register](#risk-register)

---

## Executive Summary

Entmoot v2 strips the app down from a multi-feature family planning platform to a single, focused Daily Focus Card experience. This implementation brief coordinates three parallel workstreams:

- **Engineering:** 5-phase implementation removing ~60% of the codebase and adding habit subtasks + spouse peek
- **QA:** Regression testing during strip-down, acceptance testing for new features, edge case coverage
- **Marketing:** v2 launch messaging around "less is more," user communication strategy

**Estimated effort:** 40-60 engineering hours across all phases
**Target completion:** 2 weeks from start of Phase 1

---

## Engineering Implementation Plan

### Phase 1: Strip Down (Backend + Frontend)

**Goal:** Remove all non-essential features from the codebase. This is the largest phase by file count but simplest conceptually -- it is purely deletion.

**Estimated effort:** 8-12 hours
**Dependencies:** None (can start immediately)

#### Phase 1A: Backend Strip-Down

##### Task 1.A.1: Remove Goal System (Backend)

**Files to DELETE:**
- `backend/app/models/goal.rb`
- `backend/app/models/goal_assignment.rb`
- `backend/app/controllers/api/v1/goals_controller.rb`
- `backend/app/controllers/api/v1/goal_imports_controller.rb`
- `backend/app/controllers/api/v1/first_goal_prompts_controller.rb`
- `backend/app/policies/goal_policy.rb`
- `backend/app/services/goal_refinement_service.rb`
- `backend/app/services/goal_trackability_service.rb`
- `backend/app/services/goal_import_service.rb`
- `backend/app/services/sub_goal_generation_service.rb`
- `backend/app/jobs/goal_import_job.rb`
- `backend/app/jobs/goal_trackability_assessment_job.rb`
- `backend/app/jobs/batch_trackability_assessment_job.rb`
- `backend/app/jobs/trackable_goal_issue_job.rb`
- `backend/spec/requests/api/v1/goals_spec.rb`
- `backend/spec/requests/api/v1/goal_imports_spec.rb`
- `backend/spec/requests/api/v1/goal_trackability_spec.rb`
- `backend/spec/requests/api/v1/first_goal_prompt_spec.rb`

**Files to MODIFY:**
- `backend/config/routes.rb` -- remove `resources :goals`, `resource :goal_import`, `resource :first_goal_prompt`, goal trackability route
- `backend/app/models/daily_task.rb` -- remove `belongs_to :goal, optional: true`, remove `assignee_is_family_member` validation, remove `belongs_to :assignee`
- `backend/app/models/top_priority.rb` -- remove `belongs_to :goal, optional: true`
- `backend/app/models/family.rb` -- remove `has_many :goals` if present
- `backend/app/models/user.rb` -- remove goal-related associations and methods (first_goal_created_at, etc.)
- `backend/app/controllers/api/v1/daily_plans_controller.rb` -- remove `goal_id` and `assignee_id` from `daily_plan_params`, remove `goal_summary` method, remove goal/assignee from `task_response` and `priority_response`

##### Task 1.A.2: Remove Reflections System (Backend)

**Files to DELETE:**
- `backend/app/models/reflection.rb`
- `backend/app/models/reflection_response.rb`
- `backend/app/controllers/api/v1/reflections_controller.rb`
- `backend/app/controllers/api/v1/reflection_prompts_controller.rb`
- `backend/app/controllers/api/v1/first_reflection_prompts_controller.rb`
- `backend/app/policies/reflection_policy.rb`
- `backend/spec/requests/api/v1/reflections_spec.rb`
- `backend/spec/requests/api/v1/reflection_prompts_spec.rb`
- `backend/spec/requests/api/v1/first_reflection_prompts_spec.rb`

**Files to MODIFY:**
- `backend/config/routes.rb` -- remove `resources :reflections`, `resources :reflection_prompts`, `resource :first_reflection_prompt`
- `backend/app/models/daily_plan.rb` -- remove `has_many :reflections, dependent: :destroy`
- `backend/app/models/user.rb` -- remove first_reflection_fields if present

##### Task 1.A.3: Remove Gamification System (Backend)

**Files to DELETE:**
- `backend/app/models/badge.rb`
- `backend/app/models/user_badge.rb`
- `backend/app/models/points_ledger_entry.rb`
- `backend/app/models/streak.rb`
- `backend/app/models/pet.rb`
- `backend/app/controllers/api/v1/badges_controller.rb`
- `backend/app/controllers/api/v1/points_controller.rb`
- `backend/app/controllers/api/v1/streaks_controller.rb`
- `backend/app/controllers/api/v1/leaderboards_controller.rb`
- `backend/app/controllers/api/v1/pets_controller.rb`
- `backend/app/policies/pet_policy.rb`
- `backend/app/services/badge_service.rb`
- `backend/app/services/points_service.rb`
- `backend/app/services/streak_service.rb`
- `backend/app/services/leaderboard_service.rb`
- `backend/spec/requests/api/v1/badges_spec.rb`
- `backend/spec/requests/api/v1/points_spec.rb`
- `backend/spec/requests/api/v1/streaks_spec.rb`
- `backend/spec/requests/api/v1/leaderboards_spec.rb`
- `backend/spec/requests/api/v1/pets_spec.rb`

**Files to MODIFY:**
- `backend/config/routes.rb` -- remove `resources :badges`, `resources :streaks`, `resources :points`, `resource :leaderboard`, `resources :pets`
- `backend/app/controllers/api/v1/daily_plans_controller.rb` -- remove `award_task_completion_points` method and call, remove `record_daily_planning_streak` method and call, remove `PointsService` and `StreakService` references

##### Task 1.A.4: Remove Calendar Sync System (Backend)

**Files to DELETE:**
- `backend/app/models/google_calendar_credential.rb`
- `backend/app/models/calendar_sync_mapping.rb`
- `backend/app/controllers/api/v1/google_calendar_controller.rb`
- `backend/app/services/calendar_sync_service.rb`
- `backend/app/services/google_calendar_service.rb`
- `backend/app/services/google_oauth_service.rb`
- `backend/app/jobs/calendar_initial_sync_job.rb`
- `backend/app/jobs/calendar_periodic_sync_job.rb`
- `backend/app/jobs/calendar_remove_event_job.rb`
- `backend/app/jobs/calendar_sync_job.rb`
- `backend/spec/requests/api/v1/google_calendar_spec.rb`

**Files to MODIFY:**
- `backend/config/routes.rb` -- remove `resource :google_calendar` block

##### Task 1.A.5: Remove Review Systems (Backend)

**Files to DELETE:**
- `backend/app/models/weekly_review.rb`
- `backend/app/models/monthly_review.rb`
- `backend/app/models/quarterly_review.rb`
- `backend/app/models/annual_review.rb`
- `backend/app/controllers/api/v1/weekly_reviews_controller.rb`
- `backend/app/controllers/api/v1/monthly_reviews_controller.rb`
- `backend/app/controllers/api/v1/quarterly_reviews_controller.rb`
- `backend/app/controllers/api/v1/annual_reviews_controller.rb`
- `backend/app/policies/weekly_review_policy.rb`
- `backend/app/policies/monthly_review_policy.rb`
- `backend/app/policies/quarterly_review_policy.rb`
- `backend/app/policies/annual_review_policy.rb`
- `backend/app/jobs/send_weekly_review_reminders_job.rb`
- `backend/app/jobs/send_monthly_review_reminders_job.rb`
- `backend/app/jobs/send_quarterly_review_reminders_job.rb`
- `backend/app/jobs/send_annual_review_reminders_job.rb`
- `backend/spec/requests/api/v1/weekly_reviews_spec.rb`
- `backend/spec/requests/api/v1/monthly_reviews_spec.rb`
- `backend/spec/requests/api/v1/quarterly_reviews_spec.rb`
- `backend/spec/requests/api/v1/annual_reviews_spec.rb`

**Files to MODIFY:**
- `backend/config/routes.rb` -- remove all review resource blocks

##### Task 1.A.6: Remove AI Coaching / Anthropic Integration (Backend)

**Files to DELETE:**
- `backend/app/services/anthropic_client.rb`

**Files to MODIFY:**
- Remove any Anthropic API key references from environment configs
- Remove `anthropic` gem from Gemfile (if present)

##### Task 1.A.7: Remove Activity Feed / Mentions / Miscellaneous (Backend)

**Files to DELETE:**
- `backend/app/controllers/api/v1/activity_feeds_controller.rb`
- `backend/app/controllers/api/v1/mentions_controller.rb`
- `backend/app/controllers/api/v1/my_deadlines_controller.rb`
- `backend/app/policies/activity_feed_policy.rb`
- `backend/app/services/activity_feed_service.rb`
- `backend/app/services/mention_parser_service.rb`
- `backend/app/models/mention.rb`
- `backend/spec/requests/api/v1/activity_feeds_spec.rb`
- `backend/spec/requests/api/v1/mentions_spec.rb`

**Files to MODIFY:**
- `backend/config/routes.rb` -- remove `resource :activity_feed`, `resources :mentions`, `resources :my_deadlines`
- `backend/app/models/daily_plan.rb` -- remove `include Mentionable`, remove `mentionable_fields`, remove `mentioned_by` scope
- `backend/app/models/top_priority.rb` -- remove `include Mentionable`, remove `mentionable_fields`

##### Task 1.A.8: Remove Reminder Jobs (Backend)

**Files to DELETE:**
- `backend/app/jobs/send_evening_reflection_reminders_job.rb`
- `backend/app/jobs/send_goal_check_in_reminders_job.rb`
- `backend/app/jobs/send_morning_planning_reminders_job.rb`
- `backend/app/jobs/detect_inactive_users_job.rb`
- `backend/app/jobs/detect_missed_check_ins_job.rb`
- `backend/app/jobs/detect_missed_reflections_job.rb`

##### Task 1.A.9: Database Migration -- Remove Columns

**Create migration:** `RemoveV1ColumnsFromDailyTasksAndTopPriorities`
```ruby
# Remove goal_id from daily_tasks
remove_reference :daily_tasks, :goal, foreign_key: true, index: true
# Remove assignee_id from daily_tasks
remove_reference :daily_tasks, :assignee, foreign_key: { to_table: :users }, index: true
# Remove goal_id from top_priorities
remove_reference :top_priorities, :goal, foreign_key: true, index: true
```

**IMPORTANT:** Do NOT drop removed tables yet. Phase 1 focuses on code removal. Table drops happen in a separate, later migration after data backup is confirmed. This is a safety measure.

##### Task 1.A.10: Update Routes File (Backend)

After all deletions, the `routes.rb` should be simplified to:

```ruby
namespace :api do
  namespace :v1 do
    # Auth routes (unchanged)
    scope :auth, module: :auth, as: :auth do
      post "register", to: "registrations#create"
      post "login", to: "sessions#create"
      delete "logout", to: "sessions#destroy"
      get "me", to: "users#me"
      post "password", to: "passwords#create"
      put "password", to: "passwords#update"
      post "refresh", to: "tokens#refresh"
    end

    # Family routes (simplified)
    resources :families, only: %i[index show create update destroy] do
      get "members", on: :member
      resources :invitations, only: %i[index create destroy] do
        post "resend", on: :member
      end
      resources :memberships, only: %i[index update destroy]
      resources :daily_plans, only: %i[index show update] do
        get "today", on: :collection
      end
      resources :habits, only: %i[index create update destroy] do
        post "update_positions", on: :collection
      end
    end

    # User preferences
    scope "users/me" do
      resource :notification_preferences, only: %i[show update]
      patch "profile", to: "profile#update"
      patch "password", to: "profile#update_password"
      delete "/", to: "profile#destroy"
      get "export", to: "profile#export"
    end

    # Notifications
    resources :notifications, only: [:index] do
      post "mark_as_read", on: :member
      post "mark_all_as_read", on: :collection
    end

    # Device tokens
    resources :device_tokens, only: %i[create destroy] do
      delete "unregister", on: :collection
    end

    # Public routes
    post "invitations/:token/accept", to: "invitations#accept"
    get "unsubscribe", to: "email_subscriptions#unsubscribe"
    post "newsletter/subscribe", to: "newsletter_subscriptions#create"
  end
end
```

##### Task 1.A.11: Verify Backend Still Works

- Run `bundle exec rspec` -- expect many failures from deleted specs (that is fine), but remaining specs (auth, families, daily_plans, habits, invitations) must pass
- Run `bundle exec rails db:migrate` -- migration must succeed
- Run `bundle exec rails s` -- server must start without errors
- Test `GET /api/v1/families/:id/daily_plans/today` endpoint manually

#### Phase 1B: Frontend Strip-Down

##### Task 1.B.1: Remove Goal Pages and Components (Frontend)

**Files to DELETE:**
- `frontend/src/pages/Goals.tsx`
- `frontend/src/pages/GoalTree.tsx`
- `frontend/src/components/GoalCard.tsx`
- `frontend/src/components/GoalDetailView.tsx`
- `frontend/src/components/GoalModal.tsx`
- `frontend/src/components/GoalTreeNode.tsx`
- `frontend/src/components/SortableGoalItem.tsx`
- `frontend/src/components/GoalImportModal.tsx`
- `frontend/src/components/TrackabilityBadge.tsx`
- `frontend/src/components/AnnualGoalsSection.tsx`
- `frontend/src/components/AIRefinementPanel.tsx`
- `frontend/src/components/FirstGoalPrompt.tsx`

##### Task 1.B.2: Remove Reflection / Review Pages (Frontend)

**Files to DELETE:**
- `frontend/src/pages/EveningReflection.tsx`
- `frontend/src/pages/WeeklyReview.tsx`
- `frontend/src/pages/MonthlyReview.tsx`
- `frontend/src/pages/QuarterlyReview.tsx`
- `frontend/src/pages/AnnualReview.tsx`
- `frontend/src/components/FirstReflectionPrompt.tsx`

##### Task 1.B.3: Remove Gamification Pages and Components (Frontend)

**Files to DELETE:**
- `frontend/src/pages/Leaderboard.tsx`
- `frontend/src/pages/PointsHistory.tsx`
- `frontend/src/components/BadgeShowcase.tsx`
- `frontend/src/components/PointsDisplay.tsx`
- `frontend/src/components/StreaksSummary.tsx`
- `frontend/src/components/PetCard.tsx`
- `frontend/src/components/PetModal.tsx`
- `frontend/src/components/PetsList.tsx`

##### Task 1.B.4: Remove Calendar / Misc Components (Frontend)

**Files to DELETE:**
- `frontend/src/pages/CalendarSelect.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Home.tsx` (if separate from LandingPage)
- `frontend/src/components/GoogleCalendarConnect.tsx`
- `frontend/src/components/MentionIndicator.tsx`
- `frontend/src/components/CelebrationToast.tsx`
- `frontend/src/components/GuidedTour.tsx`
- `frontend/src/components/TipTooltip.tsx`
- `frontend/src/components/onboarding/AICoachPanel.tsx`
- `frontend/src/components/onboarding/steps/BigGoalStep.tsx`
- `frontend/src/components/onboarding/steps/CalendarConnectStep.tsx`
- `frontend/src/components/settings/GoogleCalendarConnect.test.tsx`
- `frontend/src/pages/settings/CalendarSelect.test.tsx`
- `frontend/src/components/ui/mention-input.tsx`

##### Task 1.B.5: Simplify App.tsx Routes

**File to MODIFY:** `frontend/src/App.tsx`

Remove all deleted page imports and routes. The simplified route structure should be:

```
/                                  -> LandingPage (public)
/login                             -> Login
/register                          -> Register
/forgot-password                   -> ForgotPassword
/reset-password                    -> ResetPassword
/families/:id/planner              -> DailyPlanner (Focus Card)
/families/:id/habits               -> HabitsManagement (NEW - Phase 4)
/settings                          -> UserProfile / Settings
/families/:id                      -> FamilySettings
/invitations/:token                -> AcceptInvitation
/about, /contact, /privacy, /terms -> Static pages
```

Key change: `AuthenticatedRedirect` should redirect to `/families/:id/planner` instead of `/dashboard`.

Remove imports: Dashboard, Goals, GoalTree, EveningReflection, WeeklyReview, MonthlyReview, QuarterlyReview, AnnualReview, Leaderboard, CalendarSelect, PointsHistory, NotificationSettings (if removing notifications UI).

Remove: `CelebrationProvider`, `useCelebrationListener`, `CelebrationToast` imports and usage.

##### Task 1.B.6: Simplify Sidebar Navigation

**File to MODIFY:** `frontend/src/components/Sidebar.tsx`

Strip down to 3 items:
1. **Focus Card** (CalendarIcon) -> `/families/{id}/planner`
2. **Habits** (new icon or existing) -> `/families/{id}/habits`
3. **Settings** (SettingsIcon) -> `/settings`

Remove: Dashboard, Goals, Reviews section (with all sub-items), Family item.
Remove unused icon components: HomeIcon, TargetIcon, ClipboardIcon, UsersIcon.

##### Task 1.B.7: Remove Goal References from DailyPlanner

**File to MODIFY:** `frontend/src/pages/DailyPlanner.tsx`

- Remove goal dropdown/selector from task creation
- Remove goal_id from task/priority API payloads
- Remove assignee_id from task API payloads
- Remove goal display from task and priority items
- Remove any "Link to Goal" UI

##### Task 1.B.8: Remove Deleted API Hooks

**Files to check and modify/delete in `frontend/src/hooks/`:**
- Delete or gut any hooks for goals, reflections, reviews, gamification, calendar sync
- Delete any hooks for activity feed, mentions, leaderboard, badges, points, streaks

**Files to check and modify/delete in `frontend/src/lib/`:**
- Remove goal-related API functions
- Remove reflection-related API functions
- Remove gamification-related API functions
- Remove calendar-related API functions

##### Task 1.B.9: Verify Frontend Still Builds

- Run `PATH="$HOME/.asdf/shims:$PATH" npm run build` from `/frontend`
- Fix all TypeScript errors from removed imports
- Run `PATH="$HOME/.asdf/shims:$PATH" npm run lint` and fix issues
- Manually test: login -> redirects to Focus Card -> can create tasks/habits -> can toggle completions

---

### Phase 2: Habit Subtasks Backend

**Goal:** Add HabitSubtask and HabitSubtaskCompletion models, controllers, and APIs.

**Estimated effort:** 8-10 hours
**Dependencies:** Phase 1 must be complete (clean codebase)

##### Task 2.1: Create HabitSubtask Model + Migration

**Create file:** `backend/app/models/habit_subtask.rb`

```ruby
class HabitSubtask < ApplicationRecord
  belongs_to :habit
  has_many :habit_subtask_completions, dependent: :destroy

  validates :title, presence: true
  validates :position, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :ordered, -> { order(:position) }

  before_validation :set_default_position, on: :create

  private

  def set_default_position
    return if position.present?
    max_pos = habit&.habit_subtasks&.maximum(:position) || -1
    self.position = max_pos + 1
  end
end
```

**Create migration:**
```ruby
create_table :habit_subtasks do |t|
  t.references :habit, null: false, foreign_key: true
  t.string :title, null: false
  t.integer :position, null: false, default: 0
  t.timestamps
end
add_index :habit_subtasks, [:habit_id, :position]
```

##### Task 2.2: Create HabitSubtaskCompletion Model + Migration

**Create file:** `backend/app/models/habit_subtask_completion.rb`

```ruby
class HabitSubtaskCompletion < ApplicationRecord
  belongs_to :habit_subtask
  belongs_to :daily_plan

  validates :habit_subtask_id, uniqueness: { scope: :daily_plan_id }

  after_save :sync_parent_habit_completion

  private

  def sync_parent_habit_completion
    habit = habit_subtask.habit
    plan = daily_plan

    # Find all sibling subtask completions for this habit + plan
    sibling_completions = HabitSubtaskCompletion
      .joins(:habit_subtask)
      .where(habit_subtasks: { habit_id: habit.id })
      .where(daily_plan_id: plan.id)

    total_subtasks = habit.habit_subtasks.count
    completed_count = sibling_completions.where(completed: true).count

    # Update parent HabitCompletion
    parent_completion = HabitCompletion.find_or_initialize_by(
      habit_id: habit.id,
      daily_plan_id: plan.id
    )
    parent_completion.completed = (completed_count == total_subtasks && total_subtasks > 0)
    parent_completion.save! if parent_completion.changed? || parent_completion.new_record?
  end
end
```

**Create migration:**
```ruby
create_table :habit_subtask_completions do |t|
  t.references :habit_subtask, null: false, foreign_key: true
  t.references :daily_plan, null: false, foreign_key: true
  t.boolean :completed, null: false, default: false
  t.timestamps
end
add_index :habit_subtask_completions, [:habit_subtask_id, :daily_plan_id], unique: true, name: 'idx_subtask_completions_unique'
```

##### Task 2.3: Update Existing Models with Associations

**Modify:** `backend/app/models/habit.rb`
```ruby
has_many :habit_subtasks, -> { order(:position) }, dependent: :destroy
```

**Modify:** `backend/app/models/daily_plan.rb`
```ruby
has_many :habit_subtask_completions, dependent: :destroy
```

##### Task 2.4: Create HabitSubtasks Controller

**Create file:** `backend/app/controllers/api/v1/habit_subtasks_controller.rb`

Endpoints:
- `GET /api/v1/families/:family_id/habits/:habit_id/subtasks` -- list
- `POST /api/v1/families/:family_id/habits/:habit_id/subtasks` -- create
- `PATCH /api/v1/families/:family_id/habits/:habit_id/subtasks/:id` -- update
- `DELETE /api/v1/families/:family_id/habits/:habit_id/subtasks/:id` -- delete
- `POST /api/v1/families/:family_id/habits/:habit_id/subtasks/update_positions` -- reorder

##### Task 2.5: Add Subtask Routes

**Modify:** `backend/config/routes.rb`
```ruby
resources :habits, only: %i[index create update destroy] do
  post "update_positions", on: :collection
  resources :subtasks, controller: "habit_subtasks", only: %i[index create update destroy] do
    post "update_positions", on: :collection
  end
end
```

##### Task 2.6: Update HabitInitializerService

**Modify:** `backend/app/services/habit_initializer_service.rb`

When creating habits for a new user, also create default subtasks for "House Reset":

```ruby
HOUSE_RESET_SUBTASKS = [
  "Unload dishwasher",
  "Make beds",
  "Breakfast cleanup",
  "One load of laundry",
  "Quick bathroom wipe",
  "Floors: vacuum/sweep",
  "15-min house straighten",
  "Trash checked",
  "Kitchen counters wiped",
  "Dishes/dishwasher running"
].freeze
```

After creating habits, if "House Reset" habit was created, create its subtasks.

##### Task 2.7: Update Daily Plan Serialization

**Modify:** `backend/app/controllers/api/v1/daily_plans_controller.rb`

Update `habit_completion_response` to include subtask completions:

```ruby
def habit_completion_response(habit_completion)
  {
    id: habit_completion.id,
    habit_id: habit_completion.habit_id,
    daily_plan_id: habit_completion.daily_plan_id,
    completed: habit_completion.completed,
    habit: {
      id: habit_completion.habit.id,
      name: habit_completion.habit.name,
      position: habit_completion.habit.position,
      is_active: habit_completion.habit.is_active,
      subtasks: habit_completion.habit.habit_subtasks.ordered.map { |st|
        subtask_response(st, habit_completion.daily_plan_id)
      }
    }
  }
end

def subtask_response(subtask, daily_plan_id)
  completion = subtask.habit_subtask_completions.find_by(daily_plan_id: daily_plan_id)
  {
    id: subtask.id,
    title: subtask.title,
    position: subtask.position,
    completed: completion&.completed || false,
    completion_id: completion&.id
  }
end
```

##### Task 2.8: Add Subtask Completion to Daily Plan Update

**Modify:** `backend/app/controllers/api/v1/daily_plans_controller.rb`

Add to `daily_plan_params`:
```ruby
habit_subtask_completions_attributes: %i[id habit_subtask_id completed]
```

Add custom setter on DailyPlan model (similar to existing `habit_completions_attributes=`):
```ruby
def habit_subtask_completions_attributes=(attributes_collection)
  attributes_collection.each do |attributes|
    attributes = attributes.with_indifferent_access
    habit_subtask_id = attributes[:habit_subtask_id]
    next unless habit_subtask_id

    completion = habit_subtask_completions.find_or_initialize_by(habit_subtask_id: habit_subtask_id)
    completion.completed = attributes[:completed] if attributes.key?(:completed)
    completion.save! if completion.changed? || completion.new_record?
  end
end
```

##### Task 2.9: Add Spouse Today Endpoint

**Modify:** `backend/app/controllers/api/v1/daily_plans_controller.rb`

Add `spouse_today` action:
```ruby
def spouse_today
  authorize @family, policy_class: DailyPlanPolicy

  spouse = find_spouse
  unless spouse
    render json: { error: "No spouse found" }, status: :not_found
    return
  end

  spouse_plan = DailyPlan.find_or_create_for_today(user: spouse, family: @family)
  render json: { daily_plan: daily_plan_response(spouse_plan), spouse_name: spouse.name }
end

private

def find_spouse
  family_member_ids = @family.family_memberships
    .where(role: %w[admin adult])
    .where.not(user_id: current_user.id)
    .pluck(:user_id)
  User.find_by(id: family_member_ids.first)
end
```

**Modify:** `backend/config/routes.rb`
```ruby
resources :daily_plans, only: %i[index show update] do
  get "today", on: :collection
  get "spouse_today", on: :collection
end
```

##### Task 2.10: Pundit Policies for New Models

**Create file:** `backend/app/policies/habit_subtask_policy.rb`
- Authorize based on habit ownership (habit.user_id == current_user.id AND habit.family_id in user's families)

**Modify:** `backend/app/policies/daily_plan_policy.rb`
- Spouse peek: allow read access to spouse's plan within the same family (adult/admin role only)

##### Task 2.11: Initialize Subtask Completions

**Modify:** `backend/app/models/daily_plan.rb` `find_or_create_for_today`

After creating habit completions, also create subtask completions for all subtasks:
```ruby
def self.initialize_subtask_completions(plan, user, family)
  user.habits.where(family: family).active.each do |habit|
    habit.habit_subtasks.each do |subtask|
      plan.habit_subtask_completions.find_or_create_by!(habit_subtask: subtask)
    end
  end
end
```

##### Task 2.12: Request Specs

**Create files:**
- `backend/spec/requests/api/v1/habit_subtasks_spec.rb` -- CRUD + reorder tests
- `backend/spec/models/habit_subtask_spec.rb` -- validations, associations
- `backend/spec/models/habit_subtask_completion_spec.rb` -- auto-completion callback tests

Test scenarios:
- Create subtask under a habit
- Reorder subtasks
- Toggle subtask completion updates parent habit completion
- All subtasks complete -> parent auto-completes
- Uncheck one subtask -> parent un-completes
- Spouse today returns correct data
- Spouse today for user with no spouse returns 404
- Subtask completions persist across page reloads

---

### Phase 3: Focus Card Frontend Refinements

**Goal:** Make the Focus Card the landing experience, add expandable habits with subtasks, add spouse peek drawer.

**Estimated effort:** 10-14 hours
**Dependencies:** Phase 2 must be complete (APIs available)

##### Task 3.1: Make Focus Card the Landing Page

**Modify:** `frontend/src/App.tsx`
- Change `AuthenticatedRedirect` to redirect to `/families/:id/planner`
- Default authenticated route is the Focus Card
- Remove `/dashboard` route entirely

##### Task 3.2: Expandable Habit Subtasks UI

**Modify:** `frontend/src/pages/DailyPlanner.tsx` (or create new component)

For each habit in the habits section:
- If habit has subtasks, show a chevron icon and sub-counter (e.g., "3/10")
- Tap/click chevron to expand/collapse
- Expanded state shows indented subtask checkboxes
- Each subtask checkbox triggers API call to toggle subtask completion
- Auto-save on every toggle (same pattern as existing habit completion)

**New component:** `frontend/src/components/ExpandableHabit.tsx`
- Props: habit data with subtasks, plan_id, onToggleSubtask callback
- State: expanded (boolean, default collapsed)
- Renders: checkbox + name + chevron + counter at top, subtask list when expanded

##### Task 3.3: Wire Subtask Completion API

**New hook or extend existing:** `frontend/src/hooks/useHabits.ts`
- Add `useToggleSubtaskCompletion(familyId, planId)` mutation
- Calls PATCH on daily plan with `habit_subtask_completions_attributes`
- Invalidates daily plan query cache on success

##### Task 3.4: Spouse Peek Drawer

**New component:** `frontend/src/components/SpousePeekDrawer.tsx`

- Uses shadcn `Sheet` component (already in `frontend/src/components/ui/sheet.tsx`)
- Slides in from the right
- Fetches spouse's plan via `GET /api/v1/families/:id/daily_plans/spouse_today`
- Renders a read-only version of the Focus Card
- Shows spouse's name at the top
- All checkboxes are disabled (read-only)
- Dismiss by clicking outside or close button

**New hook:** `frontend/src/hooks/useSpousePlan.ts`
- `useSpousePlan(familyId)` -- fetches spouse's today plan
- Enabled only when drawer is open (lazy fetch)

##### Task 3.5: Add Spouse Peek Button to Focus Card Header

**Modify:** `frontend/src/pages/DailyPlanner.tsx`
- Add "Spouse Peek" button in the header area (per design doc layout)
- Button opens the SpousePeekDrawer
- Button hidden if user has no spouse (API returns 404)

##### Task 3.6: WebSocket Notification for Spouse Activity

**Modify:** `frontend/src/hooks/useNotificationWebSocket.ts` (if keeping WebSocket)
- Listen for spouse completion events
- When received, show a subtle toast or badge update on the spouse peek button
- Invalidate spouse plan cache to show updated data when drawer opens

---

### Phase 4: Habit Management Screen

**Goal:** Create a dedicated habit management page with subtask CRUD.

**Estimated effort:** 8-10 hours
**Dependencies:** Phase 2 must be complete (APIs available). Can run in parallel with Phase 3.

##### Task 4.1: Create Habits Management Page

**Create file:** `frontend/src/pages/HabitsManagement.tsx`

Page layout:
- Header: "My Habits" with back button
- List of all habits with drag handles for reordering (reuse existing dnd-kit setup from HabitsList)
- Each habit shows: name, subtask count (if any), edit button
- "Add Habit" button at bottom
- Reuses existing `useHabits`, `useDeleteHabit`, `useUpdateHabitPositions` hooks

##### Task 4.2: Extend HabitModal with Subtask Management

**Modify:** `frontend/src/components/HabitModal.tsx`

Add to the modal:
- Active toggle (existing `is_active` field on habit)
- Subtask section below the name field
- List of existing subtasks with drag handles (reuse dnd-kit)
- Each subtask: text input + delete button
- "Add Subtask" button
- Delete Habit button (with confirmation)

**New hooks needed:**
- `useHabitSubtasks(familyId, habitId)` -- fetch subtasks
- `useCreateSubtask(familyId, habitId)` -- create
- `useUpdateSubtask(familyId, habitId)` -- update
- `useDeleteSubtask(familyId, habitId)` -- delete
- `useUpdateSubtaskPositions(familyId, habitId)` -- reorder

##### Task 4.3: Add Route for Habits Page

**Modify:** `frontend/src/App.tsx`
```tsx
<Route
  path="/families/:id/habits"
  element={
    <ProtectedRoute>
      <MainLayout>
        <HabitsManagement />
      </MainLayout>
    </ProtectedRoute>
  }
/>
```

##### Task 4.4: Add Gear Icon Link on Focus Card

**Modify:** `frontend/src/pages/DailyPlanner.tsx`
- Add gear/settings icon next to "Non-Negotiables" header
- Links to `/families/:id/habits`
- Tooltip: "Manage Habits"

---

### Phase 5: Polish

**Goal:** Mobile responsiveness, loading states, error handling, performance.

**Estimated effort:** 6-8 hours
**Dependencies:** Phases 3 and 4 must be complete

##### Task 5.1: Mobile Responsiveness Pass

- Test Focus Card on mobile viewport (375px, 414px)
- Ensure all sections stack properly
- Spouse peek drawer fills full width on mobile
- Habit subtask indentation works on small screens
- Touch targets meet 44px minimum

##### Task 5.2: Loading States

- Skeleton loaders for Focus Card sections
- Spinner/skeleton for spouse peek drawer
- Optimistic updates for checkbox toggles
- Debounce text field auto-saves

##### Task 5.3: Error Handling

- Graceful handling of network errors on auto-save
- Retry logic for failed saves
- Toast notifications for save failures
- Error boundary for entire Focus Card

##### Task 5.4: Empty States

- First-time user with no habits: prompt to create habits
- No tasks: "Add your first task" prompt
- No spouse in family: hide spouse peek button
- Past day with no data: "No plan for this day"

##### Task 5.5: Performance Optimization

- Eager-load habit subtasks in daily plan query (avoid N+1)
- Minimize re-renders on checkbox toggle (memo components)
- Cache spouse plan for quick re-opens
- Preload today's plan on app startup

---

## QA Strategy

### Regression Test Plan (Phase 1 Strip-Down)

These tests verify that core functionality still works after removing 60% of the codebase.

#### Critical Path Regression Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| R1 | User can register | POST /api/v1/auth/register with valid data | 201, JWT returned |
| R2 | User can login | POST /api/v1/auth/login with valid credentials | 200, JWT returned |
| R3 | User can logout | DELETE /api/v1/auth/logout with valid JWT | 200 |
| R4 | Password reset flow | POST /api/v1/auth/password, then PUT with token | Email sent, password updated |
| R5 | JWT refresh | POST /api/v1/auth/refresh with valid refresh token | New access token |
| R6 | Create family | POST /api/v1/families | Family created |
| R7 | Invite member | POST /api/v1/families/:id/invitations | Invitation sent |
| R8 | Accept invitation | POST /api/v1/invitations/:token/accept | User joined family |
| R9 | Get today's plan | GET /api/v1/families/:id/daily_plans/today | Plan auto-created if needed |
| R10 | Update daily plan | PATCH /api/v1/families/:id/daily_plans/:id | Plan updated, no errors |
| R11 | Create task | Update plan with daily_tasks_attributes (new task) | Task created |
| R12 | Toggle task | Update plan with daily_tasks_attributes (completed: true) | Task toggled |
| R13 | Create top priority | Update plan with top_priorities_attributes | Priority created |
| R14 | Toggle habit completion | Update plan with habit_completions_attributes | Habit toggled |
| R15 | List habits | GET /api/v1/families/:id/habits | Habits returned |
| R16 | Create habit | POST /api/v1/families/:id/habits | Habit created |
| R17 | Reorder habits | POST /api/v1/families/:id/habits/update_positions | Positions updated |
| R18 | Shutdown notes | Update plan with shutdown_shipped/blocked | Notes saved |
| R19 | Past day navigation | GET /api/v1/families/:id/daily_plans (with date filter) | Past plans returned |
| R20 | WebSocket connection | Connect to ActionCable with JWT | Connected |

#### Negative Tests (Verify Removed Features Return 404)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| N1 | Goals API removed | GET /api/v1/families/:id/goals | 404 or routing error |
| N2 | Reflections API removed | GET /api/v1/families/:id/reflections | 404 |
| N3 | Reviews API removed | GET /api/v1/families/:id/weekly_reviews | 404 |
| N4 | Gamification API removed | GET /api/v1/users/me/badges | 404 |
| N5 | Calendar API removed | GET /api/v1/users/me/google_calendar | 404 |
| N6 | Activity feed removed | GET /api/v1/families/:id/activity_feed | 404 |
| N7 | Leaderboard removed | GET /api/v1/families/:id/leaderboard | 404 |
| N8 | goal_id not accepted | Update task with goal_id param | goal_id ignored or error |
| N9 | assignee_id not accepted | Update task with assignee_id param | assignee_id ignored or error |

### New Feature Acceptance Tests (Phases 2-4)

#### Habit Subtasks

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| S1 | Create subtask | POST subtask under habit | Subtask created with position |
| S2 | List subtasks | GET subtasks for habit | Ordered list returned |
| S3 | Update subtask title | PATCH subtask with new title | Title updated |
| S4 | Delete subtask | DELETE subtask | Subtask removed |
| S5 | Reorder subtasks | POST update_positions | Positions updated |
| S6 | Toggle subtask completion | Update plan with subtask completion | Completion toggled |
| S7 | Auto-complete parent | Complete all subtasks for a habit | Parent habit auto-completes |
| S8 | Auto-uncomplete parent | Uncheck one subtask of fully-completed habit | Parent habit un-completes |
| S9 | Subtasks in plan response | GET today plan | Subtasks nested in habit_completions |
| S10 | Subtask completions persist | Toggle subtask, reload page | Completion state preserved |
| S11 | New subtask gets completion | Add subtask to habit, load today's plan | New subtask has unchecked completion |
| S12 | Delete subtask with completions | Delete a subtask that has completions | Completions cascade-deleted |

#### Spouse Peek

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| SP1 | Get spouse plan | GET spouse_today | Returns spouse's plan data |
| SP2 | No spouse | GET spouse_today (single user family) | 404 "No spouse found" |
| SP3 | Spouse plan read-only | API returns plan data | Cannot modify via this endpoint |
| SP4 | Spouse has no plan | GET spouse_today (spouse never opened app) | Plan auto-created for spouse |
| SP5 | Multi-adult family | GET spouse_today (3 adults) | Returns first non-self adult |
| SP6 | Child cannot peek | GET spouse_today as child role | 403 Forbidden |
| SP7 | Drawer opens | Click spouse peek button | Drawer slides in with spouse data |
| SP8 | Drawer is read-only | Try to click checkboxes in drawer | Checkboxes are disabled |
| SP9 | Drawer dismisses | Click outside drawer | Drawer closes |

#### Auto-Completion Logic

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| AC1 | 0 subtasks habit | Habit with no subtasks, toggle habit | Normal toggle (no auto-completion) |
| AC2 | Partial completion | Complete 3/10 subtasks | Parent shows uncomplete, counter "3/10" |
| AC3 | Full completion | Complete 10/10 subtasks | Parent auto-completes, checkmark shown |
| AC4 | Undo last subtask | Had 10/10, uncheck 1 | Parent un-completes, counter "9/10" |
| AC5 | Add subtask to complete habit | Habit was auto-completed, add new subtask | Parent un-completes (new subtask is unchecked) |
| AC6 | Delete subtask from incomplete | Delete unchecked subtask, remaining all checked | Parent auto-completes |
| AC7 | Concurrent spouse updates | Both spouses checking items simultaneously | Each sees own correct state |

### Edge Cases

| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| E1 | User with existing goals data (v1) | Goals data in DB but no UI/API access. Data preserved but inaccessible |
| E2 | Habit with 0 subtasks | Normal habit behavior, no expand chevron shown |
| E3 | Habit with 50+ subtasks | List renders with scroll, no performance issues |
| E4 | Both spouses checking items at same time | Independent plans, no conflicts |
| E5 | User in multiple families | Focus Card shows current family's plan only |
| E6 | User removes last subtask from habit | Habit becomes normal (no subtasks), completion state preserved |
| E7 | Past day plan with subtasks | Subtask checkboxes shown but disabled (read-only) |
| E8 | Network failure during auto-save | Toast notification, retry on reconnect |
| E9 | Rapid checkbox toggling | Debounce prevents race conditions, final state wins |
| E10 | New user first visit | Default habits created with House Reset subtasks |
| E11 | Delete habit with subtask completions | All completions cascade-deleted, no orphaned records |
| E12 | Plan date boundary (timezone) | Plan creation respects family timezone |

### Automated Test Coverage Targets

| Area | Target | Type |
|------|--------|------|
| Habit subtask CRUD | 100% | Request specs |
| Auto-completion callback | 100% | Model specs |
| Spouse today endpoint | 100% | Request specs |
| Daily plan with subtasks | 100% | Request specs |
| Frontend expandable habit | 80% | Component tests |
| Frontend spouse drawer | 80% | Component tests |
| Auth flows (regression) | 100% | Existing specs |

---

## Marketing Launch Plan

### Messaging Strategy: "Less is More"

#### Core Narrative

Entmoot v2 is not a downgrade -- it is a focus upgrade. The product evolved from trying to do everything (goals, reviews, gamification, AI coaching, calendar sync) to doing one thing exceptionally well: replacing the daily planning note couples already share.

#### Key Messages

**Headline Options:**
1. "One card. Your whole day. Nothing else."
2. "We deleted 60% of our app. Here is why."
3. "The daily planner that replaces your shared Apple Note."

**Elevator Pitch:**
"Entmoot v2 is a Daily Focus Card for couples. Top 3 priorities, habits with subtasks, tasks, and shutdown notes -- all auto-saved, with one tap to see your spouse's progress. We stripped everything else away because your morning planning should take 30 seconds, not 30 minutes."

#### For Existing Users (if any)

**Email subject:** "We rebuilt Entmoot from scratch (and deleted most of it)"

**Key points:**
1. Acknowledge the old app had too many features
2. Explain the pivot to focus on what actually gets used daily
3. Highlight what is new: habit subtasks, spouse peek
4. Reassure: their daily plan data is preserved
5. Ask for feedback on the new experience

#### For New Users

**Landing page angle:** Lead with the problem (shared Apple Notes, sticky notes on the fridge, text messages about who is doing what) and the solution (one focused card per person, peek at your partner's with one tap).

**Target audience refinement for v2:**
- Couples (not full families with kids -- simplify)
- Both partners work (or one manages the household)
- Already use some informal daily planning method
- Value simplicity over feature richness

### Communication Channels

| Channel | Timing | Content |
|---------|--------|---------|
| **Email to existing users** | Day of launch | Announcement + walkthrough |
| **Landing page update** | Before launch | New copy focused on Daily Focus Card |
| **Twitter/X thread** | Launch day | "We deleted 60% of our app" narrative |
| **LinkedIn post** | Launch day | Founder's reflection on focus vs. features |
| **Product Hunt** | 1 week post-launch | "Entmoot v2 -- Daily Focus Card for Couples" |
| **Reddit r/productivity** | Launch week | "I built a daily planner that replaces my Apple Note" |
| **Blog post** | Launch day | Detailed story of the pivot and why |

### Launch Timeline

| Day | Activity |
|-----|----------|
| D-7 | Landing page copy updated, email draft reviewed |
| D-3 | Email scheduled, social posts drafted |
| D-1 | Final QA pass, launch checklist verified |
| D0 | Launch: email sent, social posts published, landing page live |
| D+1 | Monitor feedback, respond to all replies within 2 hours |
| D+3 | Iterate messaging based on initial response |
| D+7 | Product Hunt launch |
| D+14 | Reddit/HN posts, assess early metrics |

### Blog Post Outline: "Why We Deleted 60% of Our App"

1. **The problem with building everything** -- We built goals, reflections, gamification, AI coaching, calendar sync, weekly/monthly/quarterly/annual reviews. Our founding family used... daily planning and habits.
2. **What we learned** -- The most-used feature was the simplest one. The Daily Focus Card was the only screen opened every day.
3. **The decision** -- Strip everything else. Make the one thing people actually use as good as possible.
4. **What v2 looks like** -- One card, three sections (priorities, habits, tasks), shutdown notes, spouse peek.
5. **What we added** -- Habit subtasks (finally, a cleaning checklist that tracks per-item), spouse peek (see your partner's progress without asking).
6. **The philosophy** -- Less software, more intentional living. Cal Newport's multi-scale planning starts with nailing the daily scale first.

---

## Cross-Team Dependencies

| Dependency | From | To | Notes |
|------------|------|-----|-------|
| Phase 1 complete | Engineering | QA | QA runs regression tests after strip-down |
| Phase 2 APIs ready | Engineering | Engineering (Phase 3) | Frontend needs APIs to build against |
| Phase 2 APIs ready | Engineering | QA | QA writes acceptance tests for new APIs |
| Phase 3+4 UI complete | Engineering | QA | QA runs full acceptance test suite |
| QA sign-off | QA | Marketing | Marketing does not launch until QA passes |
| Landing page copy | Marketing | Engineering | Engineering updates landing page content |
| Launch date set | All | All | Coordinated go-live |

### Execution Order

```
Week 1:
  [Engineering] Phase 1: Strip down (backend then frontend)
  [QA] Write regression test plan (documented above)
  [Marketing] Draft v2 messaging and blog post

Week 2:
  [Engineering] Phase 2: Habit subtasks backend
  [QA] Run regression tests against Phase 1
  [Marketing] Update landing page copy

  [Engineering] Phase 3+4: Frontend (parallel)
  [QA] Write acceptance tests for new features

Week 3:
  [Engineering] Phase 5: Polish
  [QA] Full acceptance test run
  [Marketing] Launch preparation

Week 3-4:
  [All] Launch v2
```

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Phase 1 deletion breaks unexpected dependency | Medium | High | Run full test suite after each deletion batch, commit frequently |
| Existing user data references deleted models | Low | High | Do NOT drop database tables in Phase 1, only remove code. Tables dropped later after verified safe |
| Auto-completion callback has edge cases | Medium | Medium | Thorough model specs with all combinations |
| Spouse peek privacy concerns | Low | Medium | Read-only, same-family only, adult/admin role only |
| Performance regression from subtask N+1 queries | Medium | Low | Eager-load subtasks in daily plan query |
| Mobile UI breaks during strip-down | Medium | Medium | Test on mobile viewport after each phase |
| Frontend TypeScript errors cascade during deletion | High | Low | Delete imports before files, build frequently |

---

## Appendix: Complete File Inventory

### Files to DELETE (Backend) -- 62 files

**Models (11):** badge.rb, goal.rb, goal_assignment.rb, pet.rb, points_ledger_entry.rb, reflection.rb, reflection_response.rb, streak.rb, user_badge.rb, weekly_review.rb, monthly_review.rb, quarterly_review.rb, annual_review.rb, google_calendar_credential.rb, calendar_sync_mapping.rb, mention.rb

**Controllers (16):** goals_controller.rb, goal_imports_controller.rb, reflections_controller.rb, reflection_prompts_controller.rb, first_goal_prompts_controller.rb, first_reflection_prompts_controller.rb, badges_controller.rb, points_controller.rb, streaks_controller.rb, leaderboards_controller.rb, pets_controller.rb, activity_feeds_controller.rb, mentions_controller.rb, my_deadlines_controller.rb, weekly_reviews_controller.rb, monthly_reviews_controller.rb, quarterly_reviews_controller.rb, annual_reviews_controller.rb, google_calendar_controller.rb

**Policies (6):** goal_policy.rb, reflection_policy.rb, pet_policy.rb, activity_feed_policy.rb, weekly_review_policy.rb, monthly_review_policy.rb, quarterly_review_policy.rb, annual_review_policy.rb

**Services (12):** goal_refinement_service.rb, goal_trackability_service.rb, goal_import_service.rb, sub_goal_generation_service.rb, anthropic_client.rb, calendar_sync_service.rb, google_calendar_service.rb, google_oauth_service.rb, badge_service.rb, points_service.rb, streak_service.rb, leaderboard_service.rb, activity_feed_service.rb, mention_parser_service.rb

**Jobs (17):** All jobs listed in Task 1.A.4 and 1.A.8 above

**Specs (16+):** All spec files corresponding to deleted controllers/models

### Files to DELETE (Frontend) -- 30+ files

**Pages (10):** Goals.tsx, GoalTree.tsx, EveningReflection.tsx, WeeklyReview.tsx, MonthlyReview.tsx, QuarterlyReview.tsx, AnnualReview.tsx, Leaderboard.tsx, PointsHistory.tsx, CalendarSelect.tsx, Dashboard.tsx

**Components (20+):** All goal/gamification/calendar/reflection/AI components listed in Phase 1B

### Files to CREATE -- 8 files

**Backend (5):**
- `backend/app/models/habit_subtask.rb`
- `backend/app/models/habit_subtask_completion.rb`
- `backend/app/controllers/api/v1/habit_subtasks_controller.rb`
- `backend/app/policies/habit_subtask_policy.rb`
- `backend/db/migrate/TIMESTAMP_create_habit_subtasks_and_completions.rb`

**Frontend (3):**
- `frontend/src/components/ExpandableHabit.tsx`
- `frontend/src/components/SpousePeekDrawer.tsx`
- `frontend/src/pages/HabitsManagement.tsx`

---

*This brief was compiled by the Chief of Staff coordinating Engineering, QA, and Marketing workstreams on 2026-01-30.*
