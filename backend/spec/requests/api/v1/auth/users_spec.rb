# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth::Users" do
  describe "GET /api/v1/auth/me" do
    context "when authenticated" do
      let!(:user) { create(:user, email: "test@example.com", name: "Test User") }

      it "returns 200 and current user data" do
        get "/api/v1/auth/me", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["user"]["id"]).to eq(user.id)
        expect(json_response["user"]["email"]).to eq("test@example.com")
        expect(json_response["user"]["name"]).to eq("Test User")
      end

      it "returns avatar_url when present" do
        user.update!(avatar_url: "https://example.com/avatar.png")

        get "/api/v1/auth/me", headers: auth_headers(user)

        expect(json_response["user"]["avatar_url"]).to eq("https://example.com/avatar.png")
      end

      it "returns created_at timestamp" do
        get "/api/v1/auth/me", headers: auth_headers(user)

        expect(json_response["user"]["created_at"]).to be_present
      end
    end

    context "when not authenticated" do
      it "returns 401" do
        get "/api/v1/auth/me"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
