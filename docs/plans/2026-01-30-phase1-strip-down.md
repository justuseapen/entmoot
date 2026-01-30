# Phase 1: Strip Down Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all non-essential features (Goals, Reflections, Gamification, Calendar Sync, AI Coaching, Reviews, Activity Feed, Mentions, Reminders) from the Entmoot codebase, leaving only Daily Focus Card, Habits, Auth, and Family management.

**Architecture:** Systematic deletion in dependency order — first remove leaf dependencies (controllers, jobs, services), then models with foreign keys, then database tables. Frontend follows same pattern: pages/components first, then hooks/lib, then routes/navigation.

**Tech Stack:** Rails 7.2 API (Ruby 3.4.4), React 19/TypeScript, PostgreSQL 16, Sidekiq

---

## Task 1: Create a feature branch

**Files:** None (git operation)

**Step 1: Create branch from master**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot
git checkout -b v2/phase1-strip-down
```

**Step 2: Verify clean state**

```bash
git status
```
Expected: clean working directory on `v2/phase1-strip-down`

---

## Task 2: Remove Goals system (backend)

**Files to delete:**
- `backend/app/models/goal.rb`
- `backend/app/models/goal_assignment.rb`
- `backend/app/controllers/api/v1/goals_controller.rb`
- `backend/app/controllers/api/v1/goal_imports_controller.rb`
- `backend/app/policies/goal_policy.rb`
- `backend/app/services/goal_refinement_service.rb`
- `backend/app/services/sub_goal_generation_service.rb`
- `backend/app/services/goal_trackability_service.rb`
- `backend/app/services/goal_import_service.rb`
- `backend/app/services/git_hub_issue_service.rb`
- `backend/app/jobs/goal_import_job.rb`
- `backend/app/jobs/goal_trackability_assessment_job.rb`
- `backend/app/jobs/batch_trackability_assessment_job.rb`
- `backend/app/jobs/sub_goal_generation_job.rb`
- `backend/app/jobs/trackable_goal_issue_job.rb`
- `backend/app/jobs/send_goal_check_in_reminders_job.rb`
- `backend/spec/models/goal_spec.rb`
- `backend/spec/models/goal_assignment_spec.rb`
- `backend/spec/requests/api/v1/goals_spec.rb`
- `backend/spec/requests/api/v1/goal_imports_spec.rb`
- `backend/spec/services/goal_refinement_service_spec.rb`
- `backend/spec/services/sub_goal_generation_service_spec.rb`
- `backend/spec/services/goal_trackability_service_spec.rb`
- `backend/spec/services/goal_import_service_spec.rb`
- `backend/spec/services/git_hub_issue_service_spec.rb`
- `backend/spec/jobs/goal_import_job_spec.rb`
- `backend/spec/jobs/goal_trackability_assessment_job_spec.rb`
- `backend/spec/jobs/batch_trackability_assessment_job_spec.rb`
- `backend/spec/jobs/sub_goal_generation_job_spec.rb`
- `backend/spec/jobs/trackable_goal_issue_job_spec.rb`
- `backend/spec/jobs/send_goal_check_in_reminders_job_spec.rb`
- `backend/spec/factories/goals.rb`
- `backend/spec/factories/goal_assignments.rb`

**Files to modify:**
- `backend/app/models/user.rb` — Remove `has_many :created_goals`, `has_many :goal_assignments`, `has_many :assigned_goals`, and `total_points`/`weekly_points` methods, and references to `PointsService`
- `backend/config/routes.rb` — Remove goals resources block and goal_import resource

**Step 1: Delete all goal-related files**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
rm -f app/models/goal.rb app/models/goal_assignment.rb
rm -f app/controllers/api/v1/goals_controller.rb app/controllers/api/v1/goal_imports_controller.rb
rm -f app/policies/goal_policy.rb
rm -f app/services/goal_refinement_service.rb app/services/sub_goal_generation_service.rb app/services/goal_trackability_service.rb app/services/goal_import_service.rb app/services/git_hub_issue_service.rb
rm -f app/jobs/goal_import_job.rb app/jobs/goal_trackability_assessment_job.rb app/jobs/batch_trackability_assessment_job.rb app/jobs/sub_goal_generation_job.rb app/jobs/trackable_goal_issue_job.rb app/jobs/send_goal_check_in_reminders_job.rb
rm -f spec/models/goal_spec.rb spec/models/goal_assignment_spec.rb
rm -f spec/requests/api/v1/goals_spec.rb spec/requests/api/v1/goal_imports_spec.rb
rm -f spec/services/goal_refinement_service_spec.rb spec/services/sub_goal_generation_service_spec.rb spec/services/goal_trackability_service_spec.rb spec/services/goal_import_service_spec.rb spec/services/git_hub_issue_service_spec.rb
rm -f spec/jobs/goal_import_job_spec.rb spec/jobs/goal_trackability_assessment_job_spec.rb spec/jobs/batch_trackability_assessment_job_spec.rb spec/jobs/sub_goal_generation_job_spec.rb spec/jobs/trackable_goal_issue_job_spec.rb spec/jobs/send_goal_check_in_reminders_job_spec.rb
rm -f spec/factories/goals.rb spec/factories/goal_assignments.rb
```

**Step 2: Edit `backend/app/models/user.rb`**

Remove these lines:
```ruby
has_many :created_goals, class_name: "Goal", foreign_key: :creator_id, dependent: :destroy, inverse_of: :creator
has_many :goal_assignments, dependent: :destroy
has_many :assigned_goals, through: :goal_assignments, source: :goal
```

Remove these methods:
```ruby
def total_points
  PointsService.total_points(self)
end

def weekly_points
  PointsService.weekly_points(self)
end
```

Update `FIRST_ACTION_TYPES` to remove `goal_created`:
```ruby
FIRST_ACTION_TYPES = %w[daily_plan_completed invitation_accepted].freeze
```

Update `onboarding_required?` to remove goal check:
```ruby
def onboarding_required?
  return false if onboarding_wizard_completed_at.present?
  return false if families.any?
  true
end
```

**Step 3: Edit `backend/config/routes.rb`**

Remove the goals resources block (lines 35-47):
```ruby
        resources :goals, only: %i[index show create update destroy] do
          collection do
            post "update_positions"
            post "assess_trackability"
          end
          member do
            post "refine"
            post "regenerate_sub_goals"
          end
        end
        resource :goal_import, only: [:create] do
          get :status, on: :member
        end
```

Also remove these user preference routes:
```ruby
        # First goal prompt
        resource :first_goal_prompt, only: [:show] do
          post "dismiss", on: :member
          get "suggestions", on: :member
        end
```

**Step 4: Remove `send_goal_check_in_reminders` from `backend/config/sidekiq.yml`**

Remove the entry:
```yaml
    send_goal_check_in_reminders:
      cron: '0 10 * * *'
      class: SendGoalCheckInRemindersJob
      queue: default
      description: "Send goal check-in reminders for goals with upcoming due dates"
```

**Step 5: Run specs to check for breakage**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
bundle exec rspec spec/models/user_spec.rb spec/models/daily_plan_spec.rb spec/models/daily_task_spec.rb spec/models/top_priority_spec.rb
```

Expected: Some failures related to goal references — we'll fix those in the next tasks.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: [v2] Remove Goals system — models, controllers, services, jobs, specs"
```

---

## Task 3: Remove Reflections system (backend)

**Files to delete:**
- `backend/app/models/reflection.rb`
- `backend/app/models/reflection_response.rb`
- `backend/app/controllers/api/v1/reflections_controller.rb`
- `backend/app/controllers/api/v1/reflection_prompts_controller.rb`
- `backend/app/controllers/api/v1/first_reflection_prompts_controller.rb`
- `backend/app/policies/reflection_policy.rb`
- `backend/spec/models/reflection_spec.rb`
- `backend/spec/models/reflection_response_spec.rb`
- `backend/spec/requests/api/v1/reflections_spec.rb`
- `backend/spec/requests/api/v1/reflection_prompts_spec.rb`
- `backend/spec/requests/api/v1/first_reflection_prompts_spec.rb` (if exists)
- `backend/spec/factories/reflections.rb`
- `backend/spec/factories/reflection_responses.rb`

**Files to modify:**
- `backend/app/models/user.rb` — Remove `has_many :reflections`
- `backend/app/models/daily_plan.rb` — Remove `has_many :reflections`
- `backend/config/routes.rb` — Remove reflections, reflection_prompts, first_reflection_prompt routes

**Step 1: Delete all reflection-related files**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
rm -f app/models/reflection.rb app/models/reflection_response.rb
rm -f app/controllers/api/v1/reflections_controller.rb app/controllers/api/v1/reflection_prompts_controller.rb app/controllers/api/v1/first_reflection_prompts_controller.rb
rm -f app/policies/reflection_policy.rb
rm -f spec/models/reflection_spec.rb spec/models/reflection_response_spec.rb
rm -f spec/requests/api/v1/reflections_spec.rb spec/requests/api/v1/reflection_prompts_spec.rb spec/requests/api/v1/first_reflection_prompts_spec.rb
rm -f spec/factories/reflections.rb spec/factories/reflection_responses.rb
```

**Step 2: Edit `backend/app/models/user.rb`**

Remove: `has_many :reflections, dependent: :destroy`

**Step 3: Edit `backend/app/models/daily_plan.rb`**

Remove: `has_many :reflections, dependent: :destroy`

**Step 4: Edit `backend/config/routes.rb`**

Remove:
```ruby
        resources :reflections, only: %i[index show create update destroy]
```

Remove:
```ruby
      # Reflection prompts (public endpoint)
      resources :reflection_prompts, only: [:index]
```

Remove:
```ruby
        # First reflection prompt
        resource :first_reflection_prompt, only: %i[show create] do
          post "dismiss", on: :member
        end
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: [v2] Remove Reflections system — models, controllers, policies, specs"
```

---

## Task 4: Remove Reviews system (backend)

**Files to delete:**
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
- `backend/spec/models/weekly_review_spec.rb`
- `backend/spec/models/monthly_review_spec.rb`
- `backend/spec/models/quarterly_review_spec.rb`
- `backend/spec/models/annual_review_spec.rb`
- `backend/spec/requests/api/v1/weekly_reviews_spec.rb`
- `backend/spec/requests/api/v1/monthly_reviews_spec.rb`
- `backend/spec/requests/api/v1/quarterly_reviews_spec.rb`
- `backend/spec/requests/api/v1/annual_reviews_spec.rb`
- `backend/spec/jobs/send_weekly_review_reminders_job_spec.rb`
- `backend/spec/jobs/send_monthly_review_reminders_job_spec.rb`
- `backend/spec/jobs/send_quarterly_review_reminders_job_spec.rb`
- `backend/spec/jobs/send_annual_review_reminders_job_spec.rb`
- `backend/spec/factories/weekly_reviews.rb`
- `backend/spec/factories/monthly_reviews.rb`
- `backend/spec/factories/quarterly_reviews.rb`
- `backend/spec/factories/annual_reviews.rb`

**Files to modify:**
- `backend/app/models/user.rb` — Remove `has_many :weekly_reviews`, `monthly_reviews`, `quarterly_reviews`, `annual_reviews`
- `backend/config/routes.rb` — Remove all review resource blocks
- `backend/config/sidekiq.yml` — Remove all review reminder scheduled jobs

**Step 1: Delete all review-related files**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
rm -f app/models/weekly_review.rb app/models/monthly_review.rb app/models/quarterly_review.rb app/models/annual_review.rb
rm -f app/controllers/api/v1/weekly_reviews_controller.rb app/controllers/api/v1/monthly_reviews_controller.rb app/controllers/api/v1/quarterly_reviews_controller.rb app/controllers/api/v1/annual_reviews_controller.rb
rm -f app/policies/weekly_review_policy.rb app/policies/monthly_review_policy.rb app/policies/quarterly_review_policy.rb app/policies/annual_review_policy.rb
rm -f app/jobs/send_weekly_review_reminders_job.rb app/jobs/send_monthly_review_reminders_job.rb app/jobs/send_quarterly_review_reminders_job.rb app/jobs/send_annual_review_reminders_job.rb
rm -f spec/models/weekly_review_spec.rb spec/models/monthly_review_spec.rb spec/models/quarterly_review_spec.rb spec/models/annual_review_spec.rb
rm -f spec/requests/api/v1/weekly_reviews_spec.rb spec/requests/api/v1/monthly_reviews_spec.rb spec/requests/api/v1/quarterly_reviews_spec.rb spec/requests/api/v1/annual_reviews_spec.rb
rm -f spec/jobs/send_weekly_review_reminders_job_spec.rb spec/jobs/send_monthly_review_reminders_job_spec.rb spec/jobs/send_quarterly_review_reminders_job_spec.rb spec/jobs/send_annual_review_reminders_job_spec.rb
rm -f spec/factories/weekly_reviews.rb spec/factories/monthly_reviews.rb spec/factories/quarterly_reviews.rb spec/factories/annual_reviews.rb
```

**Step 2: Edit `backend/app/models/user.rb`**

Remove:
```ruby
has_many :weekly_reviews, dependent: :destroy
has_many :monthly_reviews, dependent: :destroy
has_many :quarterly_reviews, dependent: :destroy
has_many :annual_reviews, dependent: :destroy
```

**Step 3: Edit `backend/config/routes.rb`**

Remove the 4 review resource blocks:
```ruby
        resources :weekly_reviews, only: %i[index show update destroy] do
          get "current", on: :collection
          get "metrics", on: :member
        end
        resources :monthly_reviews, only: %i[index show update destroy] do
          get "current", on: :collection
          get "metrics", on: :member
        end
        resources :quarterly_reviews, only: %i[index show update destroy] do
          get "current", on: :collection
          get "metrics", on: :member
        end
        resources :annual_reviews, only: %i[index show update destroy] do
          get "current", on: :collection
          get "metrics", on: :member
        end
```

**Step 4: Edit `backend/config/sidekiq.yml`**

Remove:
```yaml
    send_weekly_review_reminders:
      cron: '*/5 * * * *'
      class: SendWeeklyReviewRemindersJob
      queue: default
      description: "Check and send weekly review reminder emails"

    send_monthly_review_reminders:
      cron: '0 9 * * *'
      class: SendMonthlyReviewRemindersJob
      queue: default
      description: "Send monthly review reminders on configured day of month"

    send_quarterly_review_reminders:
      cron: '0 9 * * *'
      class: SendQuarterlyReviewRemindersJob
      queue: default
      description: "Send quarterly review reminders during last week of quarter"

    send_annual_review_reminders:
      cron: '0 9 * * *'
      class: SendAnnualReviewRemindersJob
      queue: default
      description: "Send annual review reminders December 20-31"
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: [v2] Remove Reviews system — weekly, monthly, quarterly, annual"
```

---

## Task 5: Remove Gamification system (backend)

**Files to delete:**
- `backend/app/models/badge.rb`
- `backend/app/models/user_badge.rb`
- `backend/app/models/streak.rb`
- `backend/app/models/points_ledger_entry.rb`
- `backend/app/controllers/api/v1/badges_controller.rb`
- `backend/app/controllers/api/v1/streaks_controller.rb`
- `backend/app/controllers/api/v1/points_controller.rb`
- `backend/app/controllers/api/v1/leaderboards_controller.rb`
- `backend/app/services/badge_service.rb`
- `backend/app/services/streak_service.rb`
- `backend/app/services/points_service.rb`
- `backend/app/services/leaderboard_service.rb`
- `backend/spec/models/badge_spec.rb`
- `backend/spec/models/user_badge_spec.rb`
- `backend/spec/models/streak_spec.rb`
- `backend/spec/models/points_ledger_entry_spec.rb`
- `backend/spec/requests/api/v1/badges_spec.rb`
- `backend/spec/requests/api/v1/streaks_spec.rb`
- `backend/spec/requests/api/v1/points_spec.rb`
- `backend/spec/requests/api/v1/leaderboards_spec.rb`
- `backend/spec/services/badge_service_spec.rb`
- `backend/spec/services/streak_service_spec.rb`
- `backend/spec/services/points_service_spec.rb`
- `backend/spec/services/leaderboard_service_spec.rb`
- `backend/spec/factories/badges.rb`
- `backend/spec/factories/user_badges.rb`
- `backend/spec/factories/streaks.rb`
- `backend/spec/factories/points_ledger_entries.rb`

**Files to modify:**
- `backend/app/models/user.rb` — Remove `has_many :streaks`, `user_badges`, `badges`, `points_ledger_entries`
- `backend/config/routes.rb` — Remove streaks, points, badges, leaderboard routes

**Step 1: Delete all gamification-related files**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
rm -f app/models/badge.rb app/models/user_badge.rb app/models/streak.rb app/models/points_ledger_entry.rb
rm -f app/controllers/api/v1/badges_controller.rb app/controllers/api/v1/streaks_controller.rb app/controllers/api/v1/points_controller.rb app/controllers/api/v1/leaderboards_controller.rb
rm -f app/services/badge_service.rb app/services/streak_service.rb app/services/points_service.rb app/services/leaderboard_service.rb
rm -f spec/models/badge_spec.rb spec/models/user_badge_spec.rb spec/models/streak_spec.rb spec/models/points_ledger_entry_spec.rb
rm -f spec/requests/api/v1/badges_spec.rb spec/requests/api/v1/streaks_spec.rb spec/requests/api/v1/points_spec.rb spec/requests/api/v1/leaderboards_spec.rb
rm -f spec/services/badge_service_spec.rb spec/services/streak_service_spec.rb spec/services/points_service_spec.rb spec/services/leaderboard_service_spec.rb
rm -f spec/factories/badges.rb spec/factories/user_badges.rb spec/factories/streaks.rb spec/factories/points_ledger_entries.rb
```

**Step 2: Edit `backend/app/models/user.rb`**

Remove:
```ruby
has_many :streaks, dependent: :destroy
has_many :user_badges, dependent: :destroy
has_many :badges, through: :user_badges
has_many :points_ledger_entries, dependent: :destroy
```

**Step 3: Edit `backend/config/routes.rb`**

Remove from `scope "users/me"`:
```ruby
        resources :streaks, only: [:index]
        resources :points, only: [:index]
        get "badges", to: "badges#user_badges"
```

Remove from family resources:
```ruby
        resource :leaderboard, only: [:show]
```

Remove standalone badges:
```ruby
      # All badges (public-ish, requires auth)
      resources :badges, only: [:index]
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: [v2] Remove Gamification system — badges, streaks, points, leaderboard"
```

---

## Task 6: Remove Calendar Sync, AI Coaching, and Anthropic (backend)

**Files to delete:**
- `backend/app/models/google_calendar_credential.rb`
- `backend/app/models/calendar_sync_mapping.rb`
- `backend/app/controllers/api/v1/google_calendar_controller.rb`
- `backend/app/services/calendar_sync_service.rb`
- `backend/app/services/google_calendar_service.rb`
- `backend/app/services/google_oauth_service.rb`
- `backend/app/services/anthropic_client.rb`
- `backend/app/services/proactive_feedback_service.rb`
- `backend/app/jobs/calendar_sync_job.rb`
- `backend/app/jobs/calendar_initial_sync_job.rb`
- `backend/app/jobs/calendar_periodic_sync_job.rb`
- `backend/app/jobs/calendar_remove_event_job.rb`
- `backend/spec/models/google_calendar_credential_spec.rb`
- `backend/spec/models/calendar_sync_mapping_spec.rb`
- `backend/spec/requests/api/v1/google_calendar_spec.rb` (if exists)
- `backend/spec/services/calendar_sync_service_spec.rb`
- `backend/spec/services/google_calendar_service_spec.rb`
- `backend/spec/services/google_oauth_service_spec.rb`
- `backend/spec/services/anthropic_client_spec.rb`
- `backend/spec/services/proactive_feedback_service_spec.rb`
- `backend/spec/jobs/calendar_sync_job_spec.rb`
- `backend/spec/jobs/calendar_initial_sync_job_spec.rb`
- `backend/spec/jobs/calendar_periodic_sync_job_spec.rb`
- `backend/spec/jobs/calendar_remove_event_job_spec.rb`
- `backend/spec/factories/google_calendar_credentials.rb`
- `backend/spec/factories/calendar_sync_mappings.rb`

**Files to modify:**
- `backend/app/models/user.rb` — Remove `has_one :google_calendar_credential`, `has_many :calendar_sync_mappings`, and `calendar_sync_enabled?` method
- `backend/config/routes.rb` — Remove google_calendar routes
- `backend/config/sidekiq.yml` — Remove `calendar_periodic_sync`

**Step 1: Delete all calendar/AI files**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
rm -f app/models/google_calendar_credential.rb app/models/calendar_sync_mapping.rb
rm -f app/controllers/api/v1/google_calendar_controller.rb
rm -f app/services/calendar_sync_service.rb app/services/google_calendar_service.rb app/services/google_oauth_service.rb
rm -f app/services/anthropic_client.rb app/services/proactive_feedback_service.rb
rm -f app/jobs/calendar_sync_job.rb app/jobs/calendar_initial_sync_job.rb app/jobs/calendar_periodic_sync_job.rb app/jobs/calendar_remove_event_job.rb
rm -f spec/models/google_calendar_credential_spec.rb spec/models/calendar_sync_mapping_spec.rb
rm -f spec/requests/api/v1/google_calendar_spec.rb
rm -f spec/services/calendar_sync_service_spec.rb spec/services/google_calendar_service_spec.rb spec/services/google_oauth_service_spec.rb
rm -f spec/services/anthropic_client_spec.rb spec/services/proactive_feedback_service_spec.rb
rm -f spec/jobs/calendar_sync_job_spec.rb spec/jobs/calendar_initial_sync_job_spec.rb spec/jobs/calendar_periodic_sync_job_spec.rb spec/jobs/calendar_remove_event_job_spec.rb
rm -f spec/factories/google_calendar_credentials.rb spec/factories/calendar_sync_mappings.rb
```

**Step 2: Edit `backend/app/models/user.rb`**

Remove:
```ruby
has_one :google_calendar_credential, dependent: :destroy
has_many :calendar_sync_mappings, dependent: :destroy
```

Remove method:
```ruby
def calendar_sync_enabled?
  google_calendar_credential&.active?
end
```

**Step 3: Edit `backend/config/routes.rb`**

Remove from `scope "users/me"`:
```ruby
        # Google Calendar integration
        resource :google_calendar, only: %i[show destroy], controller: "google_calendar" do
          get "auth_url", on: :member
          get "callback", on: :member
          get "calendars", on: :member
          post "connect", on: :member
          post "sync", on: :member
          post "pause", on: :member
          post "resume", on: :member
        end
```

Also remove:
```ruby
      post "calendar_waitlist", to: "onboarding#calendar_waitlist"
```

**Step 4: Edit `backend/config/sidekiq.yml`**

Remove:
```yaml
    calendar_periodic_sync:
      cron: '0 * * * *'
      class: CalendarPeriodicSyncJob
      queue: low
      description: "Sync Google Calendar events for all active credentials hourly"
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: [v2] Remove Calendar Sync, AI Coaching, and Anthropic integration"
```

---

## Task 7: Remove Activity Feed, Mentions, and Engagement systems (backend)

**Files to delete:**
- `backend/app/models/mention.rb`
- `backend/app/models/concerns/mentionable.rb`
- `backend/app/controllers/api/v1/activity_feeds_controller.rb`
- `backend/app/controllers/api/v1/mentions_controller.rb`
- `backend/app/controllers/api/v1/my_deadlines_controller.rb`
- `backend/app/policies/activity_feed_policy.rb`
- `backend/app/services/activity_feed_service.rb`
- `backend/app/services/mention_parser_service.rb`
- `backend/app/services/reengagement_detection_service.rb`
- `backend/app/services/outreach_service.rb`
- `backend/app/jobs/detect_missed_check_ins_job.rb`
- `backend/app/jobs/detect_missed_reflections_job.rb`
- `backend/app/jobs/detect_inactive_users_job.rb`
- `backend/spec/models/mention_spec.rb`
- `backend/spec/models/concerns/mentionable_spec.rb`
- `backend/spec/requests/api/v1/activity_feeds_spec.rb`
- `backend/spec/requests/api/v1/mentions_spec.rb`
- `backend/spec/requests/api/v1/my_deadlines_spec.rb`
- `backend/spec/services/activity_feed_service_spec.rb`
- `backend/spec/services/mention_parser_service_spec.rb`
- `backend/spec/services/reengagement_detection_service_spec.rb`
- `backend/spec/services/outreach_service_spec.rb`
- `backend/spec/jobs/detect_missed_check_ins_job_spec.rb`
- `backend/spec/jobs/detect_missed_reflections_job_spec.rb`
- `backend/spec/jobs/detect_inactive_users_job_spec.rb`
- `backend/spec/factories/mentions.rb`

**Files to modify:**
- `backend/app/models/user.rb` — Remove `has_many :mentions_created`, `has_many :mentions`
- `backend/app/models/daily_plan.rb` — Remove `include Mentionable`, `mentionable_fields`, and `mentioned_by` scope
- `backend/app/models/top_priority.rb` — Remove `include Mentionable`, `mentionable_fields`
- `backend/config/routes.rb` — Remove activity_feed, mentions, my_deadlines routes
- `backend/config/sidekiq.yml` — Remove engagement detection jobs

**Step 1: Delete files**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
rm -f app/models/mention.rb app/models/concerns/mentionable.rb
rm -f app/controllers/api/v1/activity_feeds_controller.rb app/controllers/api/v1/mentions_controller.rb app/controllers/api/v1/my_deadlines_controller.rb
rm -f app/policies/activity_feed_policy.rb
rm -f app/services/activity_feed_service.rb app/services/mention_parser_service.rb app/services/reengagement_detection_service.rb app/services/outreach_service.rb
rm -f app/jobs/detect_missed_check_ins_job.rb app/jobs/detect_missed_reflections_job.rb app/jobs/detect_inactive_users_job.rb
rm -f spec/models/mention_spec.rb spec/models/concerns/mentionable_spec.rb
rm -f spec/requests/api/v1/activity_feeds_spec.rb spec/requests/api/v1/mentions_spec.rb spec/requests/api/v1/my_deadlines_spec.rb
rm -f spec/services/activity_feed_service_spec.rb spec/services/mention_parser_service_spec.rb spec/services/reengagement_detection_service_spec.rb spec/services/outreach_service_spec.rb
rm -f spec/jobs/detect_missed_check_ins_job_spec.rb spec/jobs/detect_missed_reflections_job_spec.rb spec/jobs/detect_inactive_users_job_spec.rb
rm -f spec/factories/mentions.rb
```

**Step 2: Edit `backend/app/models/user.rb`**

Remove:
```ruby
has_many :mentions_created, class_name: "Mention", dependent: :destroy, inverse_of: :user
has_many :mentions, foreign_key: :mentioned_user_id, dependent: :destroy, inverse_of: :mentioned_user
```

**Step 3: Edit `backend/app/models/daily_plan.rb`**

Remove: `include Mentionable`
Remove: `mentionable_fields :shutdown_shipped, :shutdown_blocked`
Remove the `mentioned_by` scope:
```ruby
scope :mentioned_by, lambda { |user_id|
  joins(:mentions).where(mentions: { mentioned_user_id: user_id }).distinct if user_id.present?
}
```

**Step 4: Edit `backend/app/models/top_priority.rb`**

Remove: `include Mentionable`
Remove: `mentionable_fields :title`

**Step 5: Edit `backend/config/routes.rb`**

Remove from family resources:
```ruby
        resource :activity_feed, only: [:show]
        resources :my_deadlines, only: [:index]
        resources :mentions, only: [] do
          get "recent", on: :collection
        end
```

**Step 6: Edit `backend/config/sidekiq.yml`**

Remove:
```yaml
    detect_missed_check_ins_noon:
      cron: '0 12 * * *'
      class: DetectMissedCheckInsJob
      queue: default
      description: "Detect users who missed morning check-in by noon"

    detect_missed_check_ins_afternoon:
      cron: '0 14 * * *'
      class: DetectMissedCheckInsJob
      queue: default
      description: "Detect users who missed morning check-in by early afternoon"

    detect_missed_reflections_evening:
      cron: '0 21 * * *'
      class: DetectMissedReflectionsJob
      queue: default
      description: "Detect users who missed evening reflection by 9pm"

    detect_missed_reflections_night:
      cron: '0 22 * * *'
      class: DetectMissedReflectionsJob
      queue: default
      description: "Detect users who missed evening reflection by 10pm"

    detect_inactive_users:
      cron: '0 10 * * *'
      class: DetectInactiveUsersJob
      queue: default
      description: "Detect and reach out to inactive users daily"
```

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: [v2] Remove Activity Feed, Mentions, and Engagement detection"
```

---

## Task 8: Remove Reminders and remaining scheduled jobs (backend)

**Files to delete:**
- `backend/app/jobs/send_morning_planning_reminders_job.rb`
- `backend/app/jobs/send_evening_reflection_reminders_job.rb`
- `backend/app/mailers/reminder_mailer.rb`
- `backend/app/mailers/outreach_mailer.rb`
- `backend/app/models/outreach_history.rb`
- `backend/spec/jobs/send_morning_planning_reminders_job_spec.rb`
- `backend/spec/jobs/send_evening_reflection_reminders_job_spec.rb`
- `backend/spec/mailers/reminder_mailer_spec.rb`
- `backend/spec/models/outreach_history_spec.rb`
- `backend/spec/factories/outreach_histories.rb`

**Files to modify:**
- `backend/app/models/user.rb` — Remove `has_many :outreach_histories`
- `backend/config/sidekiq.yml` — Remove remaining reminder entries

**Step 1: Delete files**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
rm -f app/jobs/send_morning_planning_reminders_job.rb app/jobs/send_evening_reflection_reminders_job.rb
rm -f app/mailers/reminder_mailer.rb app/mailers/outreach_mailer.rb
rm -f app/models/outreach_history.rb
rm -f spec/jobs/send_morning_planning_reminders_job_spec.rb spec/jobs/send_evening_reflection_reminders_job_spec.rb
rm -f spec/mailers/reminder_mailer_spec.rb
rm -f spec/models/outreach_history_spec.rb
rm -f spec/factories/outreach_histories.rb
```

**Step 2: Edit `backend/app/models/user.rb`**

Remove: `has_many :outreach_histories, dependent: :destroy`

**Step 3: Edit `backend/config/sidekiq.yml`**

Remove:
```yaml
    send_morning_planning_reminders:
      cron: '*/5 * * * *'
      class: SendMorningPlanningRemindersJob
      queue: default
      description: "Check and send morning planning reminder emails"

    send_evening_reflection_reminders:
      cron: '*/5 * * * *'
      class: SendEveningReflectionRemindersJob
      queue: default
      description: "Check and send evening reflection reminder emails"
```

After all removals, `sidekiq.yml` should only have:
```yaml
---
:concurrency: <%= ENV.fetch("SIDEKIQ_CONCURRENCY") { 5 } %>
:queues:
  - default
  - mailers
  - notifications
  - low

:scheduler:
  :schedule:
    send_onboarding_emails:
      cron: '0 9 * * *'
      class: SendOnboardingEmailsJob
      queue: default
      description: "Send onboarding email sequence to new users"
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: [v2] Remove Reminders, Outreach, and remaining scheduled jobs"
```

---

## Task 9: Remove DailyTask.goal_id, DailyTask.assignee_id, TopPriority.goal_id (migration + model)

**Files to create:**
- `backend/db/migrate/XXXXXX_remove_goal_and_assignee_from_daily_tasks.rb`
- `backend/db/migrate/XXXXXX_remove_goal_id_from_top_priorities.rb`

**Files to modify:**
- `backend/app/models/daily_task.rb` — Remove `belongs_to :goal`, `belongs_to :assignee`, and `assignee_is_family_member` validation
- `backend/app/models/top_priority.rb` — Remove `belongs_to :goal`

**Step 1: Generate migrations**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
bundle exec rails generate migration RemoveGoalAndAssigneeFromDailyTasks
bundle exec rails generate migration RemoveGoalIdFromTopPriorities
```

**Step 2: Write first migration (`remove_goal_and_assignee_from_daily_tasks.rb`)**

```ruby
# frozen_string_literal: true

class RemoveGoalAndAssigneeFromDailyTasks < ActiveRecord::Migration[7.2]
  def change
    remove_foreign_key :daily_tasks, :goals, if_exists: true
    remove_foreign_key :daily_tasks, :users, column: :assignee_id, if_exists: true
    remove_index :daily_tasks, :goal_id, if_exists: true
    remove_index :daily_tasks, :assignee_id, if_exists: true
    remove_column :daily_tasks, :goal_id, :bigint
    remove_column :daily_tasks, :assignee_id, :bigint
  end
end
```

**Step 3: Write second migration (`remove_goal_id_from_top_priorities.rb`)**

```ruby
# frozen_string_literal: true

class RemoveGoalIdFromTopPriorities < ActiveRecord::Migration[7.2]
  def change
    remove_foreign_key :top_priorities, :goals, if_exists: true
    remove_index :top_priorities, :goal_id, if_exists: true
    remove_column :top_priorities, :goal_id, :bigint
  end
end
```

**Step 4: Edit `backend/app/models/daily_task.rb`**

The file should become:

```ruby
# frozen_string_literal: true

class DailyTask < ApplicationRecord
  belongs_to :daily_plan

  validates :title, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :completed, -> { where(completed: true) }
  scope :incomplete, -> { where(completed: false) }
  scope :ordered, -> { order(:position) }

  before_validation :set_default_position, on: :create

  def complete!
    update!(completed: true)
  end

  def uncomplete!
    update!(completed: false)
  end

  def toggle!
    update!(completed: !completed)
  end

  private

  def set_default_position
    return if position.present?

    max_position = daily_plan&.daily_tasks&.maximum(:position) || -1
    self.position = max_position + 1
  end
end
```

**Step 5: Edit `backend/app/models/top_priority.rb`**

Remove: `belongs_to :goal, optional: true`

The file should become:

```ruby
# frozen_string_literal: true

class TopPriority < ApplicationRecord
  MAX_PRIORITIES = 3

  belongs_to :daily_plan

  validates :title, presence: true
  validates :priority_order, presence: true,
                             numericality: { only_integer: true, in: 1..MAX_PRIORITIES }
  validates :priority_order, uniqueness: { scope: :daily_plan_id, message: :already_exists }
  validate :max_priorities_per_plan

  scope :ordered, -> { order(:priority_order) }

  private

  def max_priorities_per_plan
    return unless daily_plan

    existing_count = daily_plan.top_priorities.where.not(id: id).count
    return unless existing_count >= MAX_PRIORITIES

    errors.add(:base, :max_priorities_reached)
  end
end
```

**Step 6: Run migrations**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
bundle exec rails db:migrate
```

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: [v2] Remove goal_id and assignee_id columns from DailyTask and TopPriority"
```

---

## Task 10: Clean up remaining backend routes

**File to modify:** `backend/config/routes.rb`

**Step 1: Remove these remaining routes related to removed features**

Remove tour preferences block:
```ruby
        # Tour preferences
        resource :tour_preferences, only: [:show] do
          post "complete", on: :member
          post "dismiss", on: :member
          post "restart", on: :member
        end
```

Remove first actions:
```ruby
        # First actions status
        resource :first_actions, only: [:show]
```

Remove tips:
```ruby
        # Contextual tips
        resource :tips, only: [:show] do
          post "mark_shown", on: :member
          patch "toggle", on: :member
        end
```

**Step 2: Also delete the controllers and specs for these routes**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
rm -f app/controllers/api/v1/onboarding_controller.rb
rm -f app/controllers/api/v1/first_actions_controller.rb
rm -f app/controllers/api/v1/first_goal_prompts_controller.rb
rm -f app/controllers/api/v1/tour_preferences_controller.rb
rm -f app/controllers/api/v1/tips_controller.rb
rm -f spec/requests/api/v1/onboarding_spec.rb
rm -f spec/requests/api/v1/first_actions_spec.rb
rm -f spec/requests/api/v1/first_goal_prompts_spec.rb
rm -f spec/requests/api/v1/tour_preferences_spec.rb
rm -f spec/requests/api/v1/tips_spec.rb
rm -f spec/requests/onboarding_flow_spec.rb
rm -f app/services/onboarding_metrics_service.rb
rm -f spec/services/onboarding_metrics_service_spec.rb
rm -f app/controllers/api/v1/admin/onboarding_metrics_controller.rb
rm -f spec/requests/api/v1/admin/onboarding_metrics_spec.rb
```

Remove the onboarding scope and related admin routes from routes.rb:
```ruby
      # Onboarding routes
      scope :onboarding do
        get "status", to: "onboarding#status"
        post "step/:step_name", to: "onboarding#update_step"
        post "skip/:step_name", to: "onboarding#skip_step"
        post "auto_complete", to: "onboarding#auto_complete"
      end
      post "calendar_waitlist", to: "onboarding#calendar_waitlist"
```

And:
```ruby
      # Admin routes
      namespace :admin do
        resource :onboarding_metrics, only: [:show]
        resources :feedback, only: %i[index show update], controller: "feedback"
      end
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: [v2] Remove onboarding, tours, tips, first actions routes and controllers"
```

---

## Task 11: Database migration to drop removed tables

**File to create:** `backend/db/migrate/XXXXXX_drop_removed_feature_tables.rb`

**Step 1: Generate migration**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
bundle exec rails generate migration DropRemovedFeatureTables
```

**Step 2: Write the migration**

```ruby
# frozen_string_literal: true

class DropRemovedFeatureTables < ActiveRecord::Migration[7.2]
  def up
    # Remove foreign keys first
    remove_foreign_key :goal_assignments, :goals, if_exists: true
    remove_foreign_key :goal_assignments, :users, if_exists: true
    remove_foreign_key :goals, :families, if_exists: true
    remove_foreign_key :goals, :goals, column: :parent_id, if_exists: true
    remove_foreign_key :goals, :users, column: :creator_id, if_exists: true
    remove_foreign_key :reflection_responses, :reflections, if_exists: true
    remove_foreign_key :reflections, :daily_plans, if_exists: true
    remove_foreign_key :reflections, :families, if_exists: true
    remove_foreign_key :reflections, :users, if_exists: true
    remove_foreign_key :weekly_reviews, :families, if_exists: true
    remove_foreign_key :weekly_reviews, :users, if_exists: true
    remove_foreign_key :monthly_reviews, :families, if_exists: true
    remove_foreign_key :monthly_reviews, :users, if_exists: true
    remove_foreign_key :quarterly_reviews, :families, if_exists: true
    remove_foreign_key :quarterly_reviews, :users, if_exists: true
    remove_foreign_key :annual_reviews, :families, if_exists: true
    remove_foreign_key :annual_reviews, :users, if_exists: true
    remove_foreign_key :user_badges, :badges, if_exists: true
    remove_foreign_key :user_badges, :users, if_exists: true
    remove_foreign_key :streaks, :users, if_exists: true
    remove_foreign_key :points_ledger_entries, :users, if_exists: true
    remove_foreign_key :calendar_sync_mappings, :users, if_exists: true
    remove_foreign_key :google_calendar_credentials, :users, if_exists: true
    remove_foreign_key :mentions, :users, if_exists: true
    remove_foreign_key :mentions, :users, column: :mentioned_user_id, if_exists: true
    remove_foreign_key :outreach_histories, :users, if_exists: true

    # Drop tables
    drop_table :goal_assignments, if_exists: true
    drop_table :goals, if_exists: true
    drop_table :reflection_responses, if_exists: true
    drop_table :reflections, if_exists: true
    drop_table :weekly_reviews, if_exists: true
    drop_table :monthly_reviews, if_exists: true
    drop_table :quarterly_reviews, if_exists: true
    drop_table :annual_reviews, if_exists: true
    drop_table :user_badges, if_exists: true
    drop_table :badges, if_exists: true
    drop_table :streaks, if_exists: true
    drop_table :points_ledger_entries, if_exists: true
    drop_table :calendar_sync_mappings, if_exists: true
    drop_table :google_calendar_credentials, if_exists: true
    drop_table :mentions, if_exists: true
    drop_table :outreach_histories, if_exists: true
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
```

**Step 3: Run migration**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
bundle exec rails db:migrate
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: [v2] Drop database tables for all removed features"
```

---

## Task 12: Run full backend test suite and fix breakage

**Step 1: Run all specs**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
bundle exec rspec
```

**Step 2: Fix any remaining references**

Common breakage points to check:
- Any spec referencing goal factories or goal associations
- Any spec referencing reflection factories
- Any spec referencing review factories
- `NotificationService` may reference badge/streak/goal events — review and simplify
- `daily_plans_controller.rb` may reference removed associations in its serialization
- Request specs for daily_plans may test goal_id on tasks
- Role permissions spec may test goal/reflection access

Fix each failure by removing the dead references.

**Step 3: Run rubocop**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
bundle exec rubocop -A
```

**Step 4: Commit**

```bash
git add -A && git commit -m "fix: [v2] Fix all backend test failures after feature removal"
```

---

## Task 13: Remove frontend — Goals, Reflections, Reviews pages and components

**Files to delete:**

Pages:
- `frontend/src/pages/Goals.tsx`
- `frontend/src/pages/GoalTree.tsx`
- `frontend/src/pages/EveningReflection.tsx`
- `frontend/src/pages/WeeklyReview.tsx`
- `frontend/src/pages/MonthlyReview.tsx`
- `frontend/src/pages/QuarterlyReview.tsx`
- `frontend/src/pages/AnnualReview.tsx`
- `frontend/src/pages/Dashboard.tsx`

Components:
- `frontend/src/components/GoalCard.tsx`
- `frontend/src/components/GoalDetailView.tsx`
- `frontend/src/components/GoalModal.tsx`
- `frontend/src/components/GoalTreeNode.tsx`
- `frontend/src/components/GoalImportModal.tsx`
- `frontend/src/components/AIRefinementPanel.tsx`
- `frontend/src/components/FirstGoalPrompt.tsx`
- `frontend/src/components/AnnualGoalsSection.tsx`
- `frontend/src/components/SortableGoalItem.tsx`
- `frontend/src/components/FirstReflectionPrompt.tsx`

**Step 1: Delete files**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/frontend
rm -f src/pages/Goals.tsx src/pages/GoalTree.tsx
rm -f src/pages/EveningReflection.tsx
rm -f src/pages/WeeklyReview.tsx src/pages/MonthlyReview.tsx src/pages/QuarterlyReview.tsx src/pages/AnnualReview.tsx
rm -f src/pages/Dashboard.tsx
rm -f src/components/GoalCard.tsx src/components/GoalDetailView.tsx src/components/GoalModal.tsx src/components/GoalTreeNode.tsx src/components/GoalImportModal.tsx
rm -f src/components/AIRefinementPanel.tsx src/components/FirstGoalPrompt.tsx src/components/AnnualGoalsSection.tsx src/components/SortableGoalItem.tsx
rm -f src/components/FirstReflectionPrompt.tsx
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: [v2] Remove Goals, Reflections, Reviews, and Dashboard pages/components"
```

---

## Task 14: Remove frontend — Gamification and Calendar components

**Files to delete:**

Pages:
- `frontend/src/pages/Leaderboard.tsx`
- `frontend/src/pages/PointsHistory.tsx`
- `frontend/src/pages/CalendarSelect.tsx`
- `frontend/src/pages/settings/CalendarSelect.test.tsx` (if exists at this path)

Components:
- `frontend/src/components/PointsDisplay.tsx`
- `frontend/src/components/StreaksSummary.tsx`
- `frontend/src/components/PetCard.tsx`
- `frontend/src/components/PetModal.tsx`
- `frontend/src/components/PetsList.tsx`
- `frontend/src/components/BadgeShowcase.tsx`
- `frontend/src/components/TrackabilityBadge.tsx`
- `frontend/src/components/CelebrationToast.tsx`
- `frontend/src/components/GoogleCalendarConnect.tsx`
- `frontend/src/components/GuidedTour.tsx`
- `frontend/src/components/TipTooltip.tsx`
- `frontend/src/components/MentionIndicator.tsx`
- `frontend/src/components/NotificationBell.tsx`
- `frontend/src/components/settings/GoogleCalendarConnect.test.tsx`
- `frontend/src/components/ui/mention-input.tsx`

Onboarding (removing the full wizard — will rebuild a simpler one later if needed):
- `frontend/src/components/onboarding/OnboardingWizard.tsx`
- `frontend/src/components/onboarding/OnboardingStep.tsx`
- `frontend/src/components/onboarding/OnboardingProgress.tsx`
- `frontend/src/components/onboarding/TreeAnimation.tsx`
- `frontend/src/components/onboarding/AICoachPanel.tsx`
- `frontend/src/components/onboarding/index.ts`
- `frontend/src/components/onboarding/steps/WelcomeStep.tsx`
- `frontend/src/components/onboarding/steps/FamilyBasicsStep.tsx`
- `frontend/src/components/onboarding/steps/BigGoalStep.tsx`
- `frontend/src/components/onboarding/steps/InviteFamilyStep.tsx`
- `frontend/src/components/onboarding/steps/CalendarConnectStep.tsx`
- `frontend/src/components/onboarding/steps/CompleteStep.tsx`

**Step 1: Delete files**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/frontend
rm -f src/pages/Leaderboard.tsx src/pages/PointsHistory.tsx src/pages/CalendarSelect.tsx
rm -f src/pages/settings/CalendarSelect.test.tsx
rm -f src/components/PointsDisplay.tsx src/components/StreaksSummary.tsx
rm -f src/components/PetCard.tsx src/components/PetModal.tsx src/components/PetsList.tsx
rm -f src/components/BadgeShowcase.tsx src/components/TrackabilityBadge.tsx src/components/CelebrationToast.tsx
rm -f src/components/GoogleCalendarConnect.tsx
rm -f src/components/GuidedTour.tsx src/components/TipTooltip.tsx
rm -f src/components/MentionIndicator.tsx
rm -f src/components/settings/GoogleCalendarConnect.test.tsx
rm -f src/components/ui/mention-input.tsx
rm -rf src/components/onboarding
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: [v2] Remove Gamification, Calendar, Onboarding, Tour, and Mention components"
```

---

## Task 15: Remove frontend — Hooks and API lib files for removed features

**Files to delete:**

Hooks:
- `frontend/src/hooks/useGoals.ts`
- `frontend/src/hooks/useGoalImport.ts`
- `frontend/src/hooks/useFirstGoalPrompt.ts`
- `frontend/src/hooks/useReflections.ts`
- `frontend/src/hooks/useFirstReflectionPrompt.ts`
- `frontend/src/hooks/useWeeklyReviews.ts`
- `frontend/src/hooks/useMonthlyReviews.ts`
- `frontend/src/hooks/useQuarterlyReviews.ts`
- `frontend/src/hooks/useAnnualReviews.ts`
- `frontend/src/hooks/usePoints.ts`
- `frontend/src/hooks/useStreaks.ts`
- `frontend/src/hooks/useBadges.ts`
- `frontend/src/hooks/usePets.ts`
- `frontend/src/hooks/useLeaderboard.ts`
- `frontend/src/hooks/useActivityFeed.ts`
- `frontend/src/hooks/useMentions.ts`
- `frontend/src/hooks/useMyDeadlines.ts`
- `frontend/src/hooks/useGoogleCalendar.ts`
- `frontend/src/hooks/useGoogleCalendar.test.ts`
- `frontend/src/hooks/useFeedback.ts`
- `frontend/src/hooks/useProactiveFeedback.ts`
- `frontend/src/hooks/useAdminFeedback.ts`
- `frontend/src/hooks/useTips.ts`
- `frontend/src/hooks/useTour.ts`
- `frontend/src/hooks/useOnboarding.ts`

Lib:
- `frontend/src/lib/goals.ts`
- `frontend/src/lib/goalImport.ts`
- `frontend/src/lib/firstGoalPrompt.ts`
- `frontend/src/lib/reflections.ts`
- `frontend/src/lib/firstReflectionPrompt.ts`
- `frontend/src/lib/weeklyReviews.ts`
- `frontend/src/lib/monthlyReviews.ts`
- `frontend/src/lib/quarterlyReviews.ts`
- `frontend/src/lib/annualReviews.ts`
- `frontend/src/lib/points.ts`
- `frontend/src/lib/streaks.ts`
- `frontend/src/lib/badges.ts`
- `frontend/src/lib/pets.ts`
- `frontend/src/lib/leaderboard.ts`
- `frontend/src/lib/activityFeed.ts`
- `frontend/src/lib/mentions.ts`
- `frontend/src/lib/myDeadlines.ts`
- `frontend/src/lib/googleCalendar.ts`
- `frontend/src/lib/feedback.ts`
- `frontend/src/lib/adminFeedback.ts`
- `frontend/src/lib/tips.ts`
- `frontend/src/lib/tour.ts`

Other:
- `frontend/src/contexts/ProactiveFeedbackContext.ts`
- `frontend/src/stores/onboarding.ts`
- `frontend/src/pages/AdminFeedback.tsx`
- `frontend/src/pages/Notifications.tsx`
- `frontend/src/pages/NotificationSettings.tsx`
- `frontend/src/components/FeedbackReporter.tsx`
- `frontend/src/components/FeatureFeedback.tsx`
- `frontend/src/components/SessionFeedback.tsx`
- `frontend/src/components/NPSSurvey.tsx`
- `frontend/src/components/ProactiveFeedbackProvider.tsx`

**Step 1: Delete files**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/frontend
rm -f src/hooks/useGoals.ts src/hooks/useGoalImport.ts src/hooks/useFirstGoalPrompt.ts
rm -f src/hooks/useReflections.ts src/hooks/useFirstReflectionPrompt.ts
rm -f src/hooks/useWeeklyReviews.ts src/hooks/useMonthlyReviews.ts src/hooks/useQuarterlyReviews.ts src/hooks/useAnnualReviews.ts
rm -f src/hooks/usePoints.ts src/hooks/useStreaks.ts src/hooks/useBadges.ts src/hooks/usePets.ts src/hooks/useLeaderboard.ts
rm -f src/hooks/useActivityFeed.ts src/hooks/useMentions.ts src/hooks/useMyDeadlines.ts
rm -f src/hooks/useGoogleCalendar.ts src/hooks/useGoogleCalendar.test.ts
rm -f src/hooks/useFeedback.ts src/hooks/useProactiveFeedback.ts src/hooks/useAdminFeedback.ts
rm -f src/hooks/useTips.ts src/hooks/useTour.ts src/hooks/useOnboarding.ts
rm -f src/lib/goals.ts src/lib/goalImport.ts src/lib/firstGoalPrompt.ts
rm -f src/lib/reflections.ts src/lib/firstReflectionPrompt.ts
rm -f src/lib/weeklyReviews.ts src/lib/monthlyReviews.ts src/lib/quarterlyReviews.ts src/lib/annualReviews.ts
rm -f src/lib/points.ts src/lib/streaks.ts src/lib/badges.ts src/lib/pets.ts src/lib/leaderboard.ts
rm -f src/lib/activityFeed.ts src/lib/mentions.ts src/lib/myDeadlines.ts
rm -f src/lib/googleCalendar.ts
rm -f src/lib/feedback.ts src/lib/adminFeedback.ts src/lib/tips.ts src/lib/tour.ts
rm -f src/contexts/ProactiveFeedbackContext.ts
rm -f src/stores/onboarding.ts
rm -f src/pages/AdminFeedback.tsx src/pages/Notifications.tsx src/pages/NotificationSettings.tsx
rm -f src/components/FeedbackReporter.tsx src/components/FeatureFeedback.tsx src/components/SessionFeedback.tsx src/components/NPSSurvey.tsx src/components/ProactiveFeedbackProvider.tsx
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: [v2] Remove all hooks, lib, stores, and remaining components for removed features"
```

---

## Task 16: Rewrite App.tsx routes and navigation

**Files to modify:**
- `frontend/src/App.tsx` — Strip down to only kept routes
- `frontend/src/components/Sidebar.tsx` — Simplify to Focus Card + Family + Settings
- `frontend/src/components/MobileNav.tsx` — Simplify to Focus Card + Family + Settings
- `frontend/src/components/Breadcrumbs.tsx` — Remove references to removed pages
- `frontend/src/components/MainLayout.tsx` — Remove CelebrationToast, MentionIndicator, GuidedTour, NotificationBell imports

**Step 1: Rewrite `frontend/src/App.tsx`**

The new App.tsx should only have these routes:
- `/` — Landing page
- `/about`, `/contact`, `/privacy`, `/terms`, `/roadmap` — Public pages
- `/blog`, `/blog/:slug` — Blog pages
- `/login`, `/register`, `/forgot-password`, `/reset-password` — Auth
- `/families` — Family list
- `/families/:id` — Family settings
- `/families/:id/planner` — Daily Focus Card (the main screen)
- `/profile` — User profile
- `/invitations/:token` — Accept invitation
- `/error` — Server error
- `*` — 404

Key changes:
- `AuthenticatedRedirect` should redirect to `/families` (not `/dashboard`)
- Remove `CelebrationProvider` wrapper
- Remove `NotificationWebSocketInitializer`
- Remove all goal, reflection, review, gamification, calendar, admin, notification routes
- Remove all imports for deleted pages/components

**Step 2: Rewrite `frontend/src/components/Sidebar.tsx`**

Simplify navigation to:
- Daily Focus Card (when family selected): `/families/{id}/planner`
- Family: `/families/{id}`
- Settings: `/profile`

Remove: Goals nav item, Reviews expandable section, Dashboard item.

**Step 3: Rewrite `frontend/src/components/MobileNav.tsx`**

Simplify to 3 items:
- Focus Card: `/families/{id}/planner`
- Family: `/families/{id}`
- Profile: `/profile`

Remove Goals, Review items.

**Step 4: Simplify `frontend/src/components/Breadcrumbs.tsx`**

Remove route labels for: goals, tree, reflection, weekly-review, leaderboard, points.
Keep: families, planner, settings.

**Step 5: Simplify `frontend/src/components/MainLayout.tsx`**

Remove imports and usage of:
- `MentionIndicator`
- `NotificationBell`
- `GuidedTour`

Keep the core layout structure.

**Step 6: Build to check for TypeScript errors**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/frontend
PATH="$HOME/.asdf/shims:$PATH" npm run build
```

Fix any import errors.

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: [v2] Simplify App routes, Sidebar, MobileNav, and MainLayout"
```

---

## Task 17: Run full frontend build and fix remaining breakage

**Step 1: TypeScript build check**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/frontend
PATH="$HOME/.asdf/shims:$PATH" npm run build
```

**Step 2: Fix all TypeScript errors**

Common issues:
- Imports of deleted modules in remaining files
- Type references to Goal, Reflection, Badge, etc. in shared types
- `useDailyPlans.ts` may reference `goal_id` on DailyTask type — remove it
- `useHabits.ts` may be fine but check for goal references
- Factory files in tests referencing removed types

**Step 3: Run lint**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/frontend
PATH="$HOME/.asdf/shims:$PATH" npm run lint -- --fix
```

**Step 4: Run frontend tests**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/frontend
PATH="$HOME/.asdf/shims:$PATH" npm run test:run
```

**Step 5: Fix any remaining test failures**

**Step 6: Commit**

```bash
git add -A && git commit -m "fix: [v2] Fix all frontend TypeScript and test errors after feature removal"
```

---

## Task 18: Final verification — run everything

**Step 1: Backend specs**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
bundle exec rspec
```

Expected: All passing. Zero failures.

**Step 2: Backend lint**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/backend
bundle exec rubocop
```

**Step 3: Frontend build**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/frontend
PATH="$HOME/.asdf/shims:$PATH" npm run build
```

Expected: Clean build, no errors.

**Step 4: Frontend tests**

```bash
cd /Users/justuseapen/Dropbox/code/entmoot/frontend
PATH="$HOME/.asdf/shims:$PATH" npm run test:run
```

Expected: All passing.

**Step 5: If everything passes, commit any final fixes and the plan is complete**

```bash
git add -A && git commit -m "feat: [v2] Phase 1 complete — Entmoot stripped to Daily Focus Card"
```

---

## Summary: What Remains After Phase 1

### Backend
- **Models:** User, Family, FamilyMembership, DailyPlan, DailyTask, TopPriority, Habit, HabitCompletion, JwtDenylist, RefreshToken, Invitation, Notification, NotificationPreference, DeviceToken, Pet, FeedbackReport, NewsletterSubscription
- **Controllers:** Auth (registrations, sessions, passwords, tokens, users), families, memberships, invitations, daily_plans, habits, profile, pets, notifications, notification_preferences, device_tokens, feedback, newsletter_subscriptions, webhooks
- **Services:** HabitInitializerService, NotificationService, PushNotificationService, SmsService, UserDataExportService
- **Jobs:** SendOnboardingEmailsJob, SendInvitationEmailJob, ApplicationJob

### Frontend
- **Pages:** LandingPage, Login, Register, ForgotPassword, ResetPassword, Families, FamilySettings, DailyPlanner, AcceptInvitation, UserProfile, NotFound, ServerError, Blog
- **Components:** MainLayout, Sidebar (simplified), MobileNav (simplified), Breadcrumbs, ErrorBoundary, ErrorFallback, ErrorMessage, LoadingIndicator, OfflineIndicator, ProtectedRoute, EmptyState, Skeleton, HabitModal, HabitsList, SortableHabitItem, SortableTaskItem, FamilyCreationWizard, MembersList, InviteMemberModal, PendingInvitations
- **Hooks:** useDailyPlans, useHabits, useFamilies, useFamilyMembers, useNotifications, useNotificationWebSocket, useNotificationPreferences, useProfile, useOnlineStatus, useScrollAnimation
- **Stores:** auth, family
