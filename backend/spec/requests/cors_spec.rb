# frozen_string_literal: true

require "rails_helper"

RSpec.describe "CORS" do
  # Parse the first origin from CORS_ORIGINS (supports comma-separated list)
  let(:origin) do
    cors_string = ENV.fetch("CORS_ORIGINS", "http://localhost:5173")
    cors_string.split(",").first.strip
  end

  # Common CORS headers that should be present
  shared_examples "returns CORS headers" do
    it "includes Access-Control-Allow-Origin header" do
      expect(response.headers["Access-Control-Allow-Origin"]).to eq(origin)
    end
  end

  describe "OPTIONS preflight requests" do
    context "for unauthenticated endpoints" do
      before do
        options "/health", headers: {
          "Origin" => origin,
          "Access-Control-Request-Method" => "GET",
          "Access-Control-Request-Headers" => "Content-Type"
        }
      end

      it "returns successful status" do
        expect(response).to have_http_status(:ok)
      end

      it_behaves_like "returns CORS headers"

      it "includes Access-Control-Allow-Methods header with all expected methods" do
        allowed_methods = response.headers["Access-Control-Allow-Methods"]
        expect(allowed_methods).to include("GET")
        expect(allowed_methods).to include("POST")
        expect(allowed_methods).to include("PUT")
        expect(allowed_methods).to include("PATCH")
        expect(allowed_methods).to include("DELETE")
        expect(allowed_methods).to include("OPTIONS")
        expect(allowed_methods).to include("HEAD")
      end

      it "includes Access-Control-Allow-Headers header" do
        expect(response.headers["Access-Control-Allow-Headers"]).to be_present
      end

      it "includes Access-Control-Expose-Headers with Authorization" do
        expose_headers = response.headers["Access-Control-Expose-Headers"]
        expect(expose_headers).to include("Authorization")
      end
    end

    context "for API endpoints" do
      before do
        options "/api/v1/auth/login", headers: {
          "Origin" => origin,
          "Access-Control-Request-Method" => "POST",
          "Access-Control-Request-Headers" => "Content-Type, Authorization"
        }
      end

      it "returns successful status" do
        expect(response).to have_http_status(:ok)
      end

      it_behaves_like "returns CORS headers"

      it "allows POST method" do
        expect(response.headers["Access-Control-Allow-Methods"]).to include("POST")
      end
    end

    context "for authenticated endpoints" do
      before do
        options "/api/v1/families", headers: {
          "Origin" => origin,
          "Access-Control-Request-Method" => "GET",
          "Access-Control-Request-Headers" => "Content-Type, Authorization"
        }
      end

      it "returns successful status" do
        expect(response).to have_http_status(:ok)
      end

      it_behaves_like "returns CORS headers"
    end
  end

  describe "GET requests" do
    context "for health endpoint" do
      before do
        get "/health", headers: { "Origin" => origin }
      end

      # Health endpoint may return 503 in test if dependencies are unavailable
      # The important thing is CORS headers are present regardless of status
      it "returns a response" do
        expect(response.status).to be_present
      end

      it_behaves_like "returns CORS headers"
    end

    context "for API endpoints requiring authentication" do
      let(:user) { create(:user) }
      let(:family) { create(:family) }

      before do
        create(:family_membership, family: family, user: user, role: "adult")
        get "/api/v1/families", headers: { "Origin" => origin }.merge(auth_headers(user))
      end

      it "returns successful status" do
        expect(response).to have_http_status(:ok)
      end

      it_behaves_like "returns CORS headers"
    end

    context "when user is not authenticated" do
      before do
        get "/api/v1/families", headers: { "Origin" => origin }
      end

      # Even unauthorized requests should have CORS headers
      # so the browser can read the error response
      it_behaves_like "returns CORS headers"
    end
  end

  describe "POST requests" do
    context "for login endpoint" do
      let(:user) { create(:user, password: "password123") }

      before do
        post "/api/v1/auth/login",
             params: { user: { email: user.email, password: "password123" } }.to_json,
             headers: {
               "Origin" => origin,
               "Content-Type" => "application/json"
             }
      end

      it "returns successful status" do
        expect(response).to have_http_status(:ok)
      end

      it_behaves_like "returns CORS headers"
    end

    context "for register endpoint" do
      before do
        post "/api/v1/auth/register",
             params: {
               user: {
                 email: "newuser@example.com",
                 password: "password123",
                 password_confirmation: "password123",
                 name: "Test User"
               }
             }.to_json,
             headers: {
               "Origin" => origin,
               "Content-Type" => "application/json"
             }
      end

      it_behaves_like "returns CORS headers"
    end
  end

  describe "DELETE requests" do
    context "for logout endpoint" do
      let(:user) { create(:user) }

      before do
        delete "/api/v1/auth/logout", headers: { "Origin" => origin }.merge(auth_headers(user))
      end

      it "returns successful status" do
        expect(response).to have_http_status(:success)
      end

      it_behaves_like "returns CORS headers"
    end
  end

  describe "PATCH/PUT requests" do
    let(:user) { create(:user) }
    let(:family) { create(:family) }

    before do
      create(:family_membership, family: family, user: user, role: "admin")
    end

    context "for PATCH request" do
      before do
        patch "/api/v1/families/#{family.id}",
              params: { family: { name: "Updated Name" } }.to_json,
              headers: {
                "Origin" => origin,
                "Content-Type" => "application/json"
              }.merge(auth_headers(user))
      end

      it_behaves_like "returns CORS headers"
    end
  end

  describe "origin validation" do
    # NOTE: Testing multiple origins requires app restart to reload middleware.
    # The CORS_ORIGINS env var is read at boot time.
    # These tests verify the mechanism works for the configured origin.

    it "reflects the configured origin in the response" do
      get "/health", headers: { "Origin" => origin }
      expect(response.headers["Access-Control-Allow-Origin"]).to eq(origin)
    end

    it "does not reflect arbitrary origins" do
      # Rack::Cors only reflects configured origins
      get "/health", headers: { "Origin" => "https://malicious-site.com" }
      # With default config, it should NOT include the malicious origin
      # The header will either be nil or the configured origin, never the attacker's origin
      expect(response.headers["Access-Control-Allow-Origin"]).not_to eq("https://malicious-site.com")
    end
  end

  describe "error responses" do
    context "when request returns 4xx error" do
      before do
        post "/api/v1/auth/login",
             params: { user: { email: "nonexistent@example.com", password: "wrong" } }.to_json,
             headers: {
               "Origin" => origin,
               "Content-Type" => "application/json"
             }
      end

      it "returns error status" do
        expect(response).to have_http_status(:unauthorized)
      end

      # Critical: CORS headers must be present even on error responses
      # so the browser can read the error message
      it_behaves_like "returns CORS headers"
    end

    context "when request returns 422 validation error" do
      before do
        post "/api/v1/auth/register",
             params: {
               user: {
                 email: "invalid-email",
                 password: "short"
               }
             }.to_json,
             headers: {
               "Origin" => origin,
               "Content-Type" => "application/json"
             }
      end

      it_behaves_like "returns CORS headers"
    end
  end

  describe "without Origin header" do
    # Requests without Origin header (same-origin requests) should still work
    it "processes request without requiring CORS headers" do
      get "/health"
      # Response should be received (status doesn't matter for CORS test)
      expect(response.status).to be_present
      # No CORS headers when no Origin is sent
      expect(response.headers["Access-Control-Allow-Origin"]).to be_nil
    end
  end
end
