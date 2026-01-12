# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::FirstGoalPrompt" do
  include AuthHelpers

  let(:user) { create(:user) }
  let(:family) { create(:family) }

  before { create(:family_membership, family: family, user: user, role: :admin) }

  describe "GET /api/v1/users/me/first_goal_prompt" do
    context "when user has not created a goal and is within first session" do
      it "returns should_show as true" do
        get "/api/v1/users/me/first_goal_prompt", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["should_show"]).to be true
        expect(json["first_goal_created_at"]).to be_nil
        expect(json["suggestions"]).to be_an(Array)
        expect(json["suggestions"].length).to eq(4)
      end

      it "returns goal suggestions with expected fields" do
        get "/api/v1/users/me/first_goal_prompt", headers: auth_headers(user)

        json = response.parsed_body
        suggestion = json["suggestions"].first
        expect(suggestion).to include("title", "description", "time_scale")
      end
    end

    context "when user has already created a goal" do
      before do
        user.update!(first_goal_created_at: 1.hour.ago)
      end

      it "returns should_show as false" do
        get "/api/v1/users/me/first_goal_prompt", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["should_show"]).to be false
        expect(json["first_goal_created_at"]).not_to be_nil
      end
    end

    context "when prompt was dismissed within 24 hours" do
      before do
        user.update!(first_goal_prompt_dismissed_at: 12.hours.ago)
      end

      it "returns should_show as false" do
        get "/api/v1/users/me/first_goal_prompt", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["should_show"]).to be false
      end
    end

    context "when prompt was dismissed more than 24 hours ago" do
      before do
        user.update!(first_goal_prompt_dismissed_at: 25.hours.ago)
      end

      it "returns should_show as true if still in first session" do
        # User created recently
        get "/api/v1/users/me/first_goal_prompt", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["should_show"]).to be true
      end
    end

    context "when user was created more than 30 minutes ago" do
      before do
        user.update!(created_at: 1.hour.ago)
      end

      it "returns should_show as false" do
        get "/api/v1/users/me/first_goal_prompt", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["should_show"]).to be false
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/users/me/first_goal_prompt"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/users/me/first_goal_prompt/dismiss" do
    it "sets the dismissed_at timestamp" do
      expect do
        post "/api/v1/users/me/first_goal_prompt/dismiss", headers: auth_headers(user)
      end.to(change { user.reload.first_goal_prompt_dismissed_at })

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["dismissed"]).to be true
    end

    it "returns unauthorized when not authenticated" do
      post "/api/v1/users/me/first_goal_prompt/dismiss"

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/users/me/first_goal_prompt/suggestions" do
    it "returns the goal suggestions" do
      get "/api/v1/users/me/first_goal_prompt/suggestions", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["suggestions"]).to be_an(Array)
      expect(json["suggestions"].length).to eq(4)
    end

    it "returns suggestions with required fields" do
      get "/api/v1/users/me/first_goal_prompt/suggestions", headers: auth_headers(user)

      json = response.parsed_body
      expect(json["suggestions"]).to all(include("title", "description", "time_scale"))
    end

    it "returns unauthorized when not authenticated" do
      get "/api/v1/users/me/first_goal_prompt/suggestions"

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
