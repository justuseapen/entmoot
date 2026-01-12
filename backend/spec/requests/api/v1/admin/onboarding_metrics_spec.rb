# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Admin::OnboardingMetrics" do
  let(:family) { create(:family) }
  let(:admin_membership) { create(:family_membership, family: family, role: :admin) }
  let(:admin_user) { admin_membership.user }

  let(:adult_membership) { create(:family_membership, family: family, role: :adult) }
  let(:adult_user) { adult_membership.user }

  describe "GET /api/v1/admin/onboarding_metrics" do
    context "when authenticated as admin" do
      it "returns onboarding metrics" do
        get "/api/v1/admin/onboarding_metrics", headers: auth_headers(admin_user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body

        expect(json).to have_key("date_range")
        expect(json).to have_key("summary")
        expect(json).to have_key("derived_metrics")
        expect(json).to have_key("funnel")
      end

      it "returns summary metrics" do
        get "/api/v1/admin/onboarding_metrics", headers: auth_headers(admin_user)

        json = response.parsed_body
        summary = json["summary"]

        expect(summary).to have_key("total_signups")
        expect(summary).to have_key("wizard_completions")
        expect(summary).to have_key("tour_completions")
        expect(summary).to have_key("first_goals")
        expect(summary).to have_key("first_reflections")
        expect(summary).to have_key("first_invites")
      end

      it "returns derived metrics" do
        get "/api/v1/admin/onboarding_metrics", headers: auth_headers(admin_user)

        json = response.parsed_body
        derived = json["derived_metrics"]

        expect(derived).to have_key("wizard_completion_rate")
        expect(derived).to have_key("tour_completion_rate")
        expect(derived).to have_key("day_7_retention")
        expect(derived).to have_key("avg_time_to_first_goal_hours")
        expect(derived).to have_key("avg_time_to_first_reflection_hours")
      end

      it "returns funnel metrics" do
        get "/api/v1/admin/onboarding_metrics", headers: auth_headers(admin_user)

        json = response.parsed_body
        funnel = json["funnel"]

        expect(funnel).to have_key("signup_to_wizard")
        expect(funnel).to have_key("wizard_to_first_goal")
        expect(funnel).to have_key("first_goal_to_first_reflection")
        expect(funnel).to have_key("first_reflection_to_first_invite")
      end

      context "with date range parameters" do
        it "accepts start_date parameter" do
          get "/api/v1/admin/onboarding_metrics",
              params: { start_date: 7.days.ago.to_date.to_s },
              headers: auth_headers(admin_user)

          expect(response).to have_http_status(:ok)
          json = response.parsed_body

          expect(json["date_range"]["start_date"]).to eq(7.days.ago.to_date.to_s)
        end

        it "accepts end_date parameter" do
          get "/api/v1/admin/onboarding_metrics",
              params: { end_date: 1.day.ago.to_date.to_s },
              headers: auth_headers(admin_user)

          expect(response).to have_http_status(:ok)
          json = response.parsed_body

          expect(json["date_range"]["end_date"]).to eq(1.day.ago.to_date.to_s)
        end

        it "handles invalid date format gracefully" do
          get "/api/v1/admin/onboarding_metrics",
              params: { start_date: "invalid-date" },
              headers: auth_headers(admin_user)

          expect(response).to have_http_status(:ok)
        end
      end
    end

    context "when authenticated as non-admin" do
      it "returns forbidden status" do
        get "/api/v1/admin/onboarding_metrics", headers: auth_headers(adult_user)

        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body["error"]).to eq("Admin access required")
      end
    end

    context "when not authenticated" do
      it "returns unauthorized status" do
        get "/api/v1/admin/onboarding_metrics"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with user data" do
      before do
        # Create users with various onboarding states
        create(:user, onboarding_wizard_completed_at: 1.day.ago)
        create(:user, tour_completed_at: 2.days.ago)
        create(:user, first_goal_created_at: 3.days.ago)
        create(:user, first_reflection_created_at: 4.days.ago)
        create(:user, first_family_invite_sent_at: 5.days.ago)
      end

      it "returns correct counts" do
        get "/api/v1/admin/onboarding_metrics", headers: auth_headers(admin_user)

        json = response.parsed_body
        summary = json["summary"]

        # Verify correct counts for each metric
        expect(summary["wizard_completions"]).to eq(1)
        expect(summary["tour_completions"]).to eq(1)
        expect(summary["first_goals"]).to eq(1)
        expect(summary["first_reflections"]).to eq(1)
        expect(summary["first_invites"]).to eq(1)
        # Total depends on order of let! execution
        expect(summary["total_signups"]).to be >= 5
      end
    end
  end
end
