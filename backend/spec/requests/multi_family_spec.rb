# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Multi-Family Data Isolation" do
  include AuthHelpers

  describe "Goals data isolation" do
    let(:user) { create(:user, name: "Multi-Family User") }
    let(:family_a) { create(:family, name: "Family A") }
    let(:family_b) { create(:family, name: "Family B") }
    let(:family_no_access) { create(:family, name: "Family C - No Membership") }

    before do
      create(:family_membership, :admin, family: family_a, user: user)
      create(:family_membership, :adult, family: family_b, user: user)
      create(:goal, :family_visible, family: family_a, creator: user, title: "Goal A1")
      create(:goal, :family_visible, family: family_a, creator: user, title: "Goal A2")
      create(:goal, :family_visible, family: family_b, creator: user, title: "Goal B1")
    end

    describe "GET /api/v1/families/:family_id/goals" do
      it "returns only family_a goals when accessing via family_a" do
        get "/api/v1/families/#{family_a.id}/goals", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        goals = response.parsed_body["goals"]
        expect(goals.length).to eq(2)
        expect(goals.pluck("title")).to contain_exactly("Goal A1", "Goal A2")
      end

      it "returns only family_b goals when accessing via family_b" do
        get "/api/v1/families/#{family_b.id}/goals", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        goals = response.parsed_body["goals"]
        expect(goals.length).to eq(1)
        expect(goals.first["title"]).to eq("Goal B1")
      end

      it "does not include family_b goals in family_a response" do
        get "/api/v1/families/#{family_a.id}/goals", headers: auth_headers(user)

        goals = response.parsed_body["goals"]
        expect(goals.pluck("title")).not_to include("Goal B1")
      end

      it "does not include family_a goals in family_b response" do
        get "/api/v1/families/#{family_b.id}/goals", headers: auth_headers(user)

        goals = response.parsed_body["goals"]
        expect(goals.pluck("title")).not_to include("Goal A1", "Goal A2")
      end
    end

    describe "accessing goals via wrong family_id" do
      let(:goal_in_family_a) { Goal.find_by(title: "Goal A1") }
      let(:goal_in_family_b) { Goal.find_by(title: "Goal B1") }

      it "returns not_found when accessing family_a goal via family_b endpoint" do
        get "/api/v1/families/#{family_b.id}/goals/#{goal_in_family_a.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end

      it "returns not_found when accessing family_b goal via family_a endpoint" do
        get "/api/v1/families/#{family_a.id}/goals/#{goal_in_family_b.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end

      it "cannot update family_a goal via family_b endpoint" do
        patch "/api/v1/families/#{family_b.id}/goals/#{goal_in_family_a.id}",
              params: { goal: { title: "Hacked Title" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(goal_in_family_a.reload.title).to eq("Goal A1")
      end

      it "cannot delete family_a goal via family_b endpoint" do
        delete "/api/v1/families/#{family_b.id}/goals/#{goal_in_family_a.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(Goal.exists?(goal_in_family_a.id)).to be true
      end
    end

    describe "unauthorized family access" do
      it "returns 403 when user accesses family they do not belong to" do
        get "/api/v1/families/#{family_no_access.id}/goals", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end

      it "cannot create goals in family user does not belong to" do
        post "/api/v1/families/#{family_no_access.id}/goals",
             params: { goal: { title: "Unauthorized Goal", time_scale: "weekly" } },
             headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end

      it "returns 403 when accessing daily_plans in unauthorized family" do
        get "/api/v1/families/#{family_no_access.id}/daily_plans", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end

      it "returns 403 when accessing weekly_reviews in unauthorized family" do
        get "/api/v1/families/#{family_no_access.id}/weekly_reviews", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "Daily plans data isolation" do
    let(:user) { create(:user, name: "Multi-Family User") }
    let(:family_a) { create(:family, name: "Family A") }
    let(:family_b) { create(:family, name: "Family B") }
    let(:plan_in_family_a) { create(:daily_plan, family: family_a, user: user, date: Date.current) }
    let(:plan_in_family_b) { create(:daily_plan, family: family_b, user: user, date: Date.current - 1.day) }

    before do
      create(:family_membership, :admin, family: family_a, user: user)
      create(:family_membership, :adult, family: family_b, user: user)
      plan_in_family_a
      plan_in_family_b
    end

    it "returns only family_a daily plans when accessing via family_a" do
      get "/api/v1/families/#{family_a.id}/daily_plans", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      plans = response.parsed_body["daily_plans"]
      plan_ids = plans.pluck("id")
      expect(plan_ids).to include(plan_in_family_a.id)
      expect(plan_ids).not_to include(plan_in_family_b.id)
    end

    it "returns only family_b daily plans when accessing via family_b" do
      get "/api/v1/families/#{family_b.id}/daily_plans", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      plans = response.parsed_body["daily_plans"]
      plan_ids = plans.pluck("id")
      expect(plan_ids).to include(plan_in_family_b.id)
      expect(plan_ids).not_to include(plan_in_family_a.id)
    end
  end

  describe "Weekly reviews data isolation" do
    let(:user) { create(:user, name: "Multi-Family User") }
    let(:family_a) { create(:family, name: "Family A") }
    let(:family_b) { create(:family, name: "Family B") }
    let(:review_in_family_a) do
      create(:weekly_review, family: family_a, user: user, week_start_date: Date.current.beginning_of_week)
    end
    let(:review_in_family_b) do
      create(:weekly_review, family: family_b, user: user, week_start_date: Date.current.beginning_of_week - 1.week)
    end

    before do
      create(:family_membership, :admin, family: family_a, user: user)
      create(:family_membership, :adult, family: family_b, user: user)
      review_in_family_a
      review_in_family_b
    end

    it "returns only family_a weekly reviews when accessing via family_a" do
      get "/api/v1/families/#{family_a.id}/weekly_reviews", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      reviews = response.parsed_body["weekly_reviews"]
      review_ids = reviews.pluck("id")
      expect(review_ids).to include(review_in_family_a.id)
      expect(review_ids).not_to include(review_in_family_b.id)
    end

    it "returns only family_b weekly reviews when accessing via family_b" do
      get "/api/v1/families/#{family_b.id}/weekly_reviews", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      reviews = response.parsed_body["weekly_reviews"]
      review_ids = reviews.pluck("id")
      expect(review_ids).to include(review_in_family_b.id)
      expect(review_ids).not_to include(review_in_family_a.id)
    end
  end
end
