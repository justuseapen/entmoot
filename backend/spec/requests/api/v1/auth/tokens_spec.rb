# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth::Tokens" do
  describe "POST /api/v1/auth/refresh" do
    let!(:user) { create(:user, email: "test@example.com", name: "Test User") }
    let!(:refresh_token) { create(:refresh_token, user: user) }

    context "with valid refresh token" do
      it "returns 200 and new tokens" do
        post "/api/v1/auth/refresh", params: { refresh_token: refresh_token.token }

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Token refreshed successfully.")
        expect(json_response["access_token"]).to be_present
        expect(json_response["refresh_token"]).to be_present
        expect(json_response["user"]["email"]).to eq("test@example.com")
      end

      it "revokes the old refresh token" do
        post "/api/v1/auth/refresh", params: { refresh_token: refresh_token.token }

        refresh_token.reload
        expect(refresh_token.revoked?).to be true
      end

      it "creates a new refresh token" do
        expect do
          post "/api/v1/auth/refresh", params: { refresh_token: refresh_token.token }
        end.to change(RefreshToken, :count).by(1)
      end

      it "returns a different refresh token than the original" do
        original_token = refresh_token.token

        post "/api/v1/auth/refresh", params: { refresh_token: original_token }

        expect(json_response["refresh_token"]).not_to eq(original_token)
      end

      it "returns a valid JWT access token" do
        post "/api/v1/auth/refresh", params: { refresh_token: refresh_token.token }

        access_token = json_response["access_token"]

        # Verify the token works for authenticated requests
        get "/api/v1/auth/me", headers: { "Authorization" => "Bearer #{access_token}" }
        expect(response).to have_http_status(:ok)
      end
    end

    context "with expired refresh token" do
      let!(:expired_token) { create(:refresh_token, :expired, user: user) }

      it "returns 401 with error message" do
        post "/api/v1/auth/refresh", params: { refresh_token: expired_token.token }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("Refresh token has expired.")
      end
    end

    context "with revoked refresh token" do
      let!(:revoked_token) { create(:refresh_token, :revoked, user: user) }

      it "returns 401 with error message" do
        post "/api/v1/auth/refresh", params: { refresh_token: revoked_token.token }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("Refresh token has been revoked.")
      end
    end

    context "with invalid refresh token" do
      it "returns 401 with error message" do
        post "/api/v1/auth/refresh", params: { refresh_token: "invalid_token" }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("Invalid refresh token.")
      end
    end

    context "with missing refresh token" do
      it "returns 401 with error message" do
        post "/api/v1/auth/refresh", params: {}

        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("Invalid refresh token.")
      end
    end
  end
end
