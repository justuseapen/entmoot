# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth::Tokens" do
  describe "POST /api/v1/auth/refresh" do
    # Token refresh is deprecated with session-based auth
    # Sessions are maintained via cookies automatically

    it "returns 410 Gone with deprecation message" do
      post "/api/v1/auth/refresh", params: { refresh_token: "any_token" }

      expect(response).to have_http_status(:gone)
      expect(json_response["error"]).to include("deprecated")
    end

    it "returns 410 even without refresh_token param" do
      post "/api/v1/auth/refresh"

      expect(response).to have_http_status(:gone)
    end
  end
end
