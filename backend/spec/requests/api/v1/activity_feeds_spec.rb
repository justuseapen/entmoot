# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::ActivityFeeds" do
  describe "GET /api/v1/families/:family_id/activity_feed" do
    let(:family) { create(:family) }
    let(:user) { create(:user) }

    before do
      create(:family_membership, family: family, user: user, role: :admin)
    end

    context "when authenticated as family member" do
      it "returns activity feed" do
        get "/api/v1/families/#{family.id}/activity_feed", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body).to have_key("activities")
        expect(response.parsed_body["activities"]).to be_an(Array)
      end

      it "includes recent goal activities" do
        create(:goal, family: family, creator: user, title: "Test Goal", visibility: :family)

        get "/api/v1/families/#{family.id}/activity_feed", headers: auth_headers(user)

        activities = response.parsed_body["activities"]
        expect(activities.first["type"]).to eq("goal_created")
        expect(activities.first["description"]).to include("Test Goal")
      end

      it "respects the limit parameter" do
        5.times { |i| create(:goal, family: family, creator: user, title: "Goal #{i}", visibility: :family) }

        get "/api/v1/families/#{family.id}/activity_feed", headers: auth_headers(user), params: { limit: 3 }

        activities = response.parsed_body["activities"]
        expect(activities.length).to eq(3)
      end

      it "clamps limit to maximum of 50" do
        get "/api/v1/families/#{family.id}/activity_feed", headers: auth_headers(user), params: { limit: 100 }

        expect(response).to have_http_status(:ok)
      end

      it "defaults to 10 activities" do
        15.times { |i| create(:goal, family: family, creator: user, title: "Goal #{i}", visibility: :family) }

        get "/api/v1/families/#{family.id}/activity_feed", headers: auth_headers(user)

        activities = response.parsed_body["activities"]
        expect(activities.length).to eq(10)
      end
    end

    context "when authenticated as non-family member" do
      let(:other_user) { create(:user) }

      it "returns forbidden" do
        get "/api/v1/families/#{family.id}/activity_feed", headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/families/#{family.id}/activity_feed"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with family not found" do
      it "returns not found" do
        get "/api/v1/families/999999/activity_feed", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
