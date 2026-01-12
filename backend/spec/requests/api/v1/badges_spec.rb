# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Badges" do
  let(:user) { create(:user) }
  let(:family) { create(:family) }

  before do
    create(:family_membership, user: user, family: family, role: :admin)
  end

  describe "GET /api/v1/badges" do
    context "when authenticated" do
      before do
        create(:badge, :first_goal)
        create(:badge, :first_plan)
        create(:badge, :week_warrior)
      end

      it "returns all available badges" do
        get "/api/v1/badges", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["badges"].length).to eq(3)
      end

      it "includes badge details" do
        get "/api/v1/badges", headers: auth_headers(user)

        json = response.parsed_body
        badge = json["badges"].find { |b| b["name"] == "first_goal" }

        expect(badge["description"]).to be_present
        expect(badge["icon"]).to eq("🎯")
        expect(badge["category"]).to eq("goals")
        expect(badge["criteria"]).to be_present
      end

      it "orders badges by category and name" do
        get "/api/v1/badges", headers: auth_headers(user)

        json = response.parsed_body
        categories = json["badges"].pluck("category")
        expect(categories).to eq(categories.sort)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/badges"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/users/me/badges" do
    let(:first_goal_badge) { create(:badge, :first_goal) }
    let(:week_warrior_badge) { create(:badge, :week_warrior) }

    before do
      # Stub badge checking to avoid side effects
      allow(BadgeService).to receive(:check_all_badges).and_return([])
    end

    context "when authenticated" do
      before do
        first_goal_badge
        create(:badge, :goal_setter)
        week_warrior_badge
      end

      it "returns badges with earned status" do
        create(:user_badge, user: user, badge: first_goal_badge)

        get "/api/v1/users/me/badges", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body

        first_goal = json["badges"].find { |b| b["name"] == "first_goal" }
        goal_setter = json["badges"].find { |b| b["name"] == "goal_setter" }

        expect(first_goal["earned"]).to be true
        expect(first_goal["earned_at"]).to be_present

        expect(goal_setter["earned"]).to be false
        expect(goal_setter["earned_at"]).to be_nil
      end

      it "returns badge stats" do
        create(:user_badge, user: user, badge: first_goal_badge)
        create(:user_badge, user: user, badge: week_warrior_badge)

        get "/api/v1/users/me/badges", headers: auth_headers(user)

        json = response.parsed_body
        stats = json["stats"]

        expect(stats["total_badges"]).to eq(3)
        expect(stats["earned_badges"]).to eq(2)
        expect(stats["completion_percentage"]).to eq(67)
      end

      it "checks for newly eligible badges" do
        get "/api/v1/users/me/badges", headers: auth_headers(user)

        expect(BadgeService).to have_received(:check_all_badges).with(user)
      end

      it "returns badge details including icon and category" do
        get "/api/v1/users/me/badges", headers: auth_headers(user)

        json = response.parsed_body
        badge = json["badges"].first

        expect(badge["name"]).to be_present
        expect(badge["description"]).to be_present
        expect(badge["icon"]).to be_present
        expect(badge["category"]).to be_present
      end
    end

    context "when user has no badges" do
      before do
        first_goal_badge
        week_warrior_badge
      end

      it "returns empty earned badges with stats" do
        get "/api/v1/users/me/badges", headers: auth_headers(user)

        json = response.parsed_body

        earned_count = json["badges"].count { |b| b["earned"] }
        expect(earned_count).to eq(0)
        expect(json["stats"]["earned_badges"]).to eq(0)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/users/me/badges"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "badge earning integration" do
    before do
      create(:badge, :first_goal)
      # Don't stub for this test
      allow(BadgeService).to receive(:check_all_badges).and_call_original
      allow(NotificationService).to receive(:notify_badge_earned)
    end

    context "when user becomes eligible for a badge" do
      before do
        create(:goal, creator: user, family: family)
      end

      it "awards the badge when checking" do
        get "/api/v1/users/me/badges", headers: auth_headers(user)

        json = response.parsed_body
        first_goal = json["badges"].find { |b| b["name"] == "first_goal" }

        expect(first_goal["earned"]).to be true
      end

      it "sends a notification" do
        get "/api/v1/users/me/badges", headers: auth_headers(user)

        expect(NotificationService).to have_received(:notify_badge_earned)
          .with(user: user, badge_name: "first_goal")
      end
    end
  end
end
