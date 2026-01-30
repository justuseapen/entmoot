# frozen_string_literal: true

# rubocop:disable Rails/SkipsModelValidations
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

  describe "activity timestamps via factory and model" do
    it "user factory has nil activity timestamps by default" do
      new_user = create(:user)

      expect(new_user.last_active_at).to be_nil
      expect(new_user.last_daily_plan_at).to be_nil
    end

    it "activity timestamps are stored in the database" do
      now = Time.current
      user.update_columns(
        last_active_at: now,
        last_daily_plan_at: now - 1.day
      )

      user.reload
      expect(user.last_active_at).to be_within(1.second).of(now)
      expect(user.last_daily_plan_at).to be_within(1.second).of(now - 1.day)
    end
  end
end

# rubocop:enable Rails/SkipsModelValidations
