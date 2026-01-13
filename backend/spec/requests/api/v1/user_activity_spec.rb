# frozen_string_literal: true

# rubocop:disable Rails/SkipsModelValidations, RSpec/ExampleLength
require "rails_helper"

RSpec.describe "User Activity Tracking" do
  let(:user) { create(:user) }
  let(:family) { create(:family, timezone: "America/New_York") }

  before { create(:family_membership, :admin, family: family, user: user) }

  describe "last_active_at tracking" do
    context "when user makes an authenticated API request" do
      it "updates last_active_at when it is nil" do
        expect(user.last_active_at).to be_nil

        get "/api/v1/families/#{family.id}/daily_plans/today", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.last_active_at).to be_present
        expect(user.last_active_at).to be_within(5.seconds).of(Time.current)
      end

      it "updates last_active_at when more than 1 hour has passed" do
        old_time = 2.hours.ago
        user.update_column(:last_active_at, old_time)

        get "/api/v1/families/#{family.id}/daily_plans/today", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.last_active_at).to be > old_time
        expect(user.last_active_at).to be_within(5.seconds).of(Time.current)
      end

      it "does not update last_active_at if less than 1 hour has passed (debouncing)" do
        recent_time = 30.minutes.ago
        user.update_column(:last_active_at, recent_time)

        get "/api/v1/families/#{family.id}/daily_plans/today", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.last_active_at).to be_within(1.second).of(recent_time)
      end
    end

    context "when user is not authenticated" do
      it "does not track activity" do
        get "/api/v1/families/#{family.id}/daily_plans/today"

        expect(response).to have_http_status(:unauthorized)
        user.reload
        expect(user.last_active_at).to be_nil
      end
    end
  end

  describe "last_daily_plan_at tracking" do
    let(:daily_plan) { create(:daily_plan, user: user, family: family) }

    context "when updating a daily plan with content" do
      it "updates last_daily_plan_at when adding tasks" do
        expect(user.last_daily_plan_at).to be_nil

        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: {
                daily_plan: {
                  daily_tasks_attributes: [
                    { title: "New task", position: 0 }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.last_daily_plan_at).to be_present
        expect(user.last_daily_plan_at).to be_within(5.seconds).of(Time.current)
      end

      it "updates last_daily_plan_at when adding top priorities" do
        expect(user.last_daily_plan_at).to be_nil

        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: {
                daily_plan: {
                  top_priorities_attributes: [
                    { title: "Priority 1", priority_order: 1 }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.last_daily_plan_at).to be_present
      end

      it "updates last_daily_plan_at when setting intention" do
        expect(user.last_daily_plan_at).to be_nil

        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: { daily_plan: { intention: "Be productive today" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.last_daily_plan_at).to be_present
      end

      it "does not update last_daily_plan_at when plan has no content" do
        # Create an empty plan and try to update with empty content
        empty_plan = create(:daily_plan, user: user, family: family, intention: nil)

        patch "/api/v1/families/#{family.id}/daily_plans/#{empty_plan.id}",
              params: { daily_plan: { intention: "" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.last_daily_plan_at).to be_nil
      end
    end
  end

  describe "last_reflection_at tracking" do
    let(:daily_plan) { create(:daily_plan, user: user, family: family) }

    context "when completing an evening reflection" do
      it "updates last_reflection_at when creating a completed reflection" do
        expect(user.last_reflection_at).to be_nil

        post "/api/v1/families/#{family.id}/reflections",
             params: {
               daily_plan_id: daily_plan.id,
               reflection: {
                 reflection_type: "evening",
                 mood: "good",
                 energy_level: 4,
                 gratitude_items: %w[family health progress],
                 reflection_responses_attributes: [
                   { prompt: "What went well?", response: "Everything!" }
                 ]
               }
             },
             headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        user.reload
        expect(user.last_reflection_at).to be_present
        expect(user.last_reflection_at).to be_within(5.seconds).of(Time.current)
      end

      it "updates last_reflection_at when updating reflection to complete" do
        reflection = create(:reflection, :evening, daily_plan: daily_plan)
        expect(user.last_reflection_at).to be_nil

        patch "/api/v1/families/#{family.id}/reflections/#{reflection.id}",
              params: {
                reflection: {
                  mood: "great",
                  energy_level: 5,
                  gratitude_items: ["progress"],
                  reflection_responses_attributes: [
                    { prompt: "What went well?", response: "Met my goals" }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.last_reflection_at).to be_present
      end

      it "does not update last_reflection_at for non-evening reflections" do
        expect(user.last_reflection_at).to be_nil

        # Use weekly reflection type (which requires daily_plan) instead of quick
        post "/api/v1/families/#{family.id}/reflections",
             params: {
               daily_plan_id: daily_plan.id,
               reflection: {
                 reflection_type: "weekly",
                 reflection_responses_attributes: [
                   { prompt: "Weekly thought", response: "Done" }
                 ]
               }
             },
             headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        user.reload
        expect(user.last_reflection_at).to be_nil
      end

      it "does not update last_reflection_at for incomplete evening reflections" do
        expect(user.last_reflection_at).to be_nil

        # Create reflection without required fields for completion
        post "/api/v1/families/#{family.id}/reflections",
             params: {
               daily_plan_id: daily_plan.id,
               reflection: {
                 reflection_type: "evening"
               }
             },
             headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        user.reload
        expect(user.last_reflection_at).to be_nil
      end
    end
  end

  describe "last_weekly_review_at tracking" do
    let(:weekly_review) { create(:weekly_review, user: user, family: family, completed: false) }

    context "when completing a weekly review" do
      it "updates last_weekly_review_at when marking review as completed" do
        expect(user.last_weekly_review_at).to be_nil

        patch "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}",
              params: {
                weekly_review: {
                  completed: true,
                  wins: ["Completed all tasks"],
                  challenges: ["Time management"],
                  lessons_learned: "Need to prioritize better"
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.last_weekly_review_at).to be_present
        expect(user.last_weekly_review_at).to be_within(5.seconds).of(Time.current)
      end

      it "does not update last_weekly_review_at when review is not completed" do
        expect(user.last_weekly_review_at).to be_nil

        patch "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}",
              params: {
                weekly_review: {
                  wins: ["Good progress"],
                  completed: false
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.last_weekly_review_at).to be_nil
      end

      it "does not update last_weekly_review_at when review was already completed" do
        completed_time = 1.day.ago
        weekly_review.update!(completed: true)
        user.update_column(:last_weekly_review_at, completed_time)

        # Update an already completed review
        patch "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}",
              params: {
                weekly_review: {
                  lessons_learned: "Additional lessons"
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.last_weekly_review_at).to be_within(1.second).of(completed_time)
      end
    end
  end

  describe "activity timestamps via factory and model" do
    it "user factory has nil activity timestamps by default" do
      new_user = create(:user)

      expect(new_user.last_active_at).to be_nil
      expect(new_user.last_daily_plan_at).to be_nil
      expect(new_user.last_reflection_at).to be_nil
      expect(new_user.last_weekly_review_at).to be_nil
    end

    it "activity timestamps are stored in the database" do
      now = Time.current
      user.update_columns(
        last_active_at: now,
        last_daily_plan_at: now - 1.day,
        last_reflection_at: now - 2.days,
        last_weekly_review_at: now - 1.week
      )

      user.reload
      expect(user.last_active_at).to be_within(1.second).of(now)
      expect(user.last_daily_plan_at).to be_within(1.second).of(now - 1.day)
      expect(user.last_reflection_at).to be_within(1.second).of(now - 2.days)
      expect(user.last_weekly_review_at).to be_within(1.second).of(now - 1.week)
    end
  end
end

# rubocop:enable Rails/SkipsModelValidations, RSpec/ExampleLength
