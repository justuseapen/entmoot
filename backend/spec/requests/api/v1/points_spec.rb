# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Points" do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }

  describe "GET /api/v1/users/me/points" do
    context "when authenticated" do
      before do
        create(:points_ledger_entry, :complete_task, user: user, created_at: 1.hour.ago)
        create(:points_ledger_entry, :complete_reflection, user: user, created_at: 2.hours.ago)
        create(:points_ledger_entry, :complete_weekly_review, user: other_user)
      end

      it "returns 200 OK" do
        get "/api/v1/users/me/points", headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
      end

      it "returns total points for the user" do
        get "/api/v1/users/me/points", headers: auth_headers(user)
        expect(response.parsed_body.dig("points", "total")).to eq(25) # 5 + 20
      end

      it "returns this week's points" do
        get "/api/v1/users/me/points", headers: auth_headers(user)
        expect(response.parsed_body.dig("points", "this_week")).to eq(25)
      end

      it "returns points breakdown by activity type" do
        get "/api/v1/users/me/points", headers: auth_headers(user)
        breakdown = response.parsed_body.dig("points", "breakdown")
        expect(breakdown).to include("complete_task" => 5, "complete_reflection" => 20)
      end

      it "returns recent activity for the user" do
        get "/api/v1/users/me/points", headers: auth_headers(user)
        activity = response.parsed_body["recent_activity"]
        expect(activity.length).to eq(2)
      end

      it "does not include other users' points" do
        get "/api/v1/users/me/points", headers: auth_headers(user)
        expect(response.parsed_body.dig("points", "total")).to eq(25)
        expect(response.parsed_body.dig("points", "total")).not_to eq(75)
      end

      it "orders recent activity by created_at descending" do
        get "/api/v1/users/me/points", headers: auth_headers(user)
        activity = response.parsed_body["recent_activity"]
        expect(activity.first["activity_type"]).to eq("complete_task")
        expect(activity.last["activity_type"]).to eq("complete_reflection")
      end

      it "includes activity labels in response" do
        get "/api/v1/users/me/points", headers: auth_headers(user)
        activity = response.parsed_body["recent_activity"]
        expect(activity.first["activity_label"]).to eq("Completed a task")
      end

      it "includes metadata in activity entries" do
        get "/api/v1/users/me/points", headers: auth_headers(user)
        activity = response.parsed_body["recent_activity"]
        expect(activity.first["metadata"]).to be_a(Hash)
      end
    end

    context "with limit parameter" do
      before do
        create_list(:points_ledger_entry, 10, user: user)
      end

      it "respects the limit parameter" do
        get "/api/v1/users/me/points", params: { limit: 5 }, headers: auth_headers(user)
        expect(response.parsed_body["recent_activity"].length).to eq(5)
      end

      it "caps limit at 100" do
        create_list(:points_ledger_entry, 110, user: user)
        get "/api/v1/users/me/points", params: { limit: 200 }, headers: auth_headers(user)
        expect(response.parsed_body["recent_activity"].length).to be <= 20
      end

      it "defaults to 20 when limit is invalid" do
        create_list(:points_ledger_entry, 25, user: user)
        get "/api/v1/users/me/points", params: { limit: -5 }, headers: auth_headers(user)
        expect(response.parsed_body["recent_activity"].length).to eq(20)
      end
    end

    context "when user has no points" do
      it "returns zeros for all totals" do
        get "/api/v1/users/me/points", headers: auth_headers(user)
        expect(response.parsed_body.dig("points", "total")).to eq(0)
        expect(response.parsed_body.dig("points", "this_week")).to eq(0)
      end

      it "returns empty breakdown" do
        get "/api/v1/users/me/points", headers: auth_headers(user)
        expect(response.parsed_body.dig("points", "breakdown")).to eq({})
      end

      it "returns empty recent activity" do
        get "/api/v1/users/me/points", headers: auth_headers(user)
        expect(response.parsed_body["recent_activity"]).to eq([])
      end
    end

    context "when unauthenticated" do
      it "returns 401 Unauthorized" do
        get "/api/v1/users/me/points"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
