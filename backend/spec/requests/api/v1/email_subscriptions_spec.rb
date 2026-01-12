# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::EmailSubscriptions" do
  describe "GET /api/v1/unsubscribe" do
    let(:user) { create(:user) }
    let!(:preference) { create(:notification_preference, user: user) }

    def generate_token(user, reminder_type, expires_at: 1.year.from_now)
      payload = { user_id: user.id, reminder_type: reminder_type, exp: expires_at.to_i }
      JWT.encode(payload, Rails.application.secret_key_base)
    end

    context "with valid token for morning_planning" do
      let(:token) { generate_token(user, :morning_planning) }

      it "unsubscribes from morning planning emails" do
        expect(preference.morning_planning).to be true

        get "/api/v1/unsubscribe", params: { token: token }

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Successfully unsubscribed from morning planning emails")
        expect(preference.reload.morning_planning).to be false
      end
    end

    context "with valid token for evening_reflection" do
      let(:token) { generate_token(user, :evening_reflection) }

      it "unsubscribes from evening reflection emails" do
        expect(preference.evening_reflection).to be true

        get "/api/v1/unsubscribe", params: { token: token }

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Successfully unsubscribed from evening reflection emails")
        expect(preference.reload.evening_reflection).to be false
      end
    end

    context "with valid token for weekly_review" do
      let(:token) { generate_token(user, :weekly_review) }

      it "unsubscribes from weekly review emails" do
        expect(preference.weekly_review).to be true

        get "/api/v1/unsubscribe", params: { token: token }

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Successfully unsubscribed from weekly review emails")
        expect(preference.reload.weekly_review).to be false
      end
    end

    context "with valid token for goal_check_in" do
      let(:token) { generate_token(user, :goal_check_in) }

      it "disables email notifications entirely" do
        expect(preference.email).to be true

        get "/api/v1/unsubscribe", params: { token: token }

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Successfully unsubscribed from goal check in emails")
        expect(preference.reload.email).to be false
      end
    end

    context "with invalid token" do
      it "returns bad request error" do
        get "/api/v1/unsubscribe", params: { token: "invalid-token" }

        expect(response).to have_http_status(:bad_request)
        expect(json_response["error"]).to eq("Invalid or expired unsubscribe token")
      end
    end

    context "with expired token" do
      let(:token) { generate_token(user, :morning_planning, expires_at: 1.day.ago) }

      it "returns bad request error" do
        get "/api/v1/unsubscribe", params: { token: token }

        expect(response).to have_http_status(:bad_request)
        expect(json_response["error"]).to eq("Invalid or expired unsubscribe token")
      end
    end

    context "with token for non-existent user" do
      let(:token) { generate_token(build(:user, id: 999_999), :morning_planning) }

      it "returns not found error" do
        get "/api/v1/unsubscribe", params: { token: token }

        expect(response).to have_http_status(:not_found)
        expect(json_response["error"]).to eq("User not found")
      end
    end

    context "when user has no notification preferences" do
      let(:user_without_prefs) { create(:user) }
      let(:token) { generate_token(user_without_prefs, :morning_planning) }

      it "creates preferences and unsubscribes" do
        expect(user_without_prefs.notification_preference).to be_nil

        get "/api/v1/unsubscribe", params: { token: token }

        expect(response).to have_http_status(:ok)
        expect(user_without_prefs.reload.notification_preference.morning_planning).to be false
      end
    end

    context "with valid token for onboarding" do
      let(:token) do
        payload = { user_id: user.id, type: :onboarding, exp: 1.year.from_now.to_i }
        JWT.encode(payload, Rails.application.secret_key_base)
      end

      it "unsubscribes from onboarding emails" do
        expect(user.onboarding_unsubscribed).to be false

        get "/api/v1/unsubscribe", params: { token: token }

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Successfully unsubscribed from onboarding emails")
        expect(user.reload.onboarding_unsubscribed).to be true
      end
    end
  end

  private

  def json_response
    response.parsed_body
  end
end
