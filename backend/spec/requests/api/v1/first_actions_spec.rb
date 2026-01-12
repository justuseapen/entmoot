# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::FirstActions" do
  let(:user) { create(:user, first_actions: {}) }

  describe "GET /api/v1/users/me/first_actions" do
    context "when authenticated" do
      it "returns empty first_actions when no actions completed" do
        get "/api/v1/users/me/first_actions", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["first_actions"]).to eq({})
        expect(json_response["all_completed"]).to be false
      end

      it "returns completed first_actions" do
        user.update!(first_actions: {
                       "goal_created" => "2026-01-01T12:00:00Z",
                       "reflection_completed" => "2026-01-01T13:00:00Z"
                     })

        get "/api/v1/users/me/first_actions", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["first_actions"]).to have_key("goal_created")
        expect(json_response["first_actions"]).to have_key("reflection_completed")
        expect(json_response["all_completed"]).to be false
      end

      it "returns all_completed true when all actions are completed" do
        user.update!(first_actions: {
                       "goal_created" => "2026-01-01T12:00:00Z",
                       "reflection_completed" => "2026-01-01T13:00:00Z",
                       "daily_plan_completed" => "2026-01-01T14:00:00Z",
                       "invitation_accepted" => "2026-01-01T15:00:00Z"
                     })

        get "/api/v1/users/me/first_actions", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["all_completed"]).to be true
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        get "/api/v1/users/me/first_actions"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
