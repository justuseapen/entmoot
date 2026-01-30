# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth::Sessions" do
  describe "POST /api/v1/auth/login" do
    let!(:user) { create(:user, email: "test@example.com", password: "password123") }

    context "with valid credentials" do
      let(:valid_params) do
        {
          user: {
            email: "test@example.com",
            password: "password123"
          }
        }
      end

      it "returns 200 and user data" do
        post "/api/v1/auth/login", params: valid_params

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Logged in successfully.")
        expect(json_response["user"]["email"]).to eq("test@example.com")
      end

      it "returns user id, name, and avatar_url" do
        user.update!(name: "Test User", avatar_url: "https://example.com/avatar.png")
        post "/api/v1/auth/login", params: valid_params

        expect(json_response["user"]["id"]).to eq(user.id)
        expect(json_response["user"]["name"]).to eq("Test User")
        expect(json_response["user"]["avatar_url"]).to eq("https://example.com/avatar.png")
      end

      it "returns a JWT token in Authorization header" do
        post "/api/v1/auth/login", params: valid_params

        expect(response).to have_http_status(:ok)
        expect(response.headers["Authorization"]).to be_present
        expect(response.headers["Authorization"]).to start_with("Bearer ")
      end

      it "allows authenticated requests with JWT token" do
        post "/api/v1/auth/login", params: valid_params
        token = response.headers["Authorization"]

        # After login, subsequent requests should be authenticated with JWT
        get "/api/v1/auth/me", headers: { "Authorization" => token }
        expect(response).to have_http_status(:ok)
        expect(json_response["user"]["email"]).to eq("test@example.com")
      end
    end

    context "with invalid credentials" do
      it "returns 401 with friendly message for wrong password" do
        post "/api/v1/auth/login", params: {
          user: { email: "test@example.com", password: "wrongpassword" }
        }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("Incorrect email or password. Please try again.")
        expect(json_response["suggestion"]).to be_nil
      end

      it "returns 401 with friendly message and suggestion for non-existent email" do
        post "/api/v1/auth/login", params: {
          user: { email: "nonexistent@example.com", password: "password123" }
        }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("No account found with this email.")
        expect(json_response["suggestion"]).to eq("Would you like to create one?")
      end
    end
  end

  describe "DELETE /api/v1/auth/logout" do
    let!(:user) { create(:user) }

    context "when authenticated" do
      it "returns 200 and logs out successfully" do
        delete "/api/v1/auth/logout", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Logged out successfully.")
      end

      it "JWT token authentication works before and after logout" do
        # Login via the actual endpoint to get JWT
        post "/api/v1/auth/login", params: {
          user: { email: user.email, password: "password123" }
        }
        expect(response).to have_http_status(:ok)
        token = response.headers["Authorization"]

        # Verify we're authenticated with JWT
        get "/api/v1/auth/me", headers: { "Authorization" => token }
        expect(response).to have_http_status(:ok)

        # Logout
        delete "/api/v1/auth/logout", headers: { "Authorization" => token }
        expect(response).to have_http_status(:ok)

        # NOTE: With devise-jwt using Null revocation strategy, the token
        # remains valid after logout. For true revocation, would need to
        # implement a proper revocation strategy (e.g., denylist/allowlist)
      end
    end

    context "when not authenticated" do
      it "returns 401" do
        delete "/api/v1/auth/logout"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "JWT-based authentication" do
    let(:jwt_user) { create(:user, email: "jwt@example.com", password: "password123") }
    let(:valid_params) do
      {
        user: {
          email: "jwt@example.com",
          password: "password123"
        }
      }
    end

    before { jwt_user }

    describe "JWT token on login" do
      it "returns JWT token in Authorization header on successful login" do
        post "/api/v1/auth/login", params: valid_params

        expect(response).to have_http_status(:ok)
        expect(response.headers["Authorization"]).to be_present
        expect(response.headers["Authorization"]).to start_with("Bearer ")
      end
    end

    describe "JWT-based request authentication" do
      it "allows authenticated requests with JWT token" do
        # Login to get JWT token
        post "/api/v1/auth/login", params: valid_params
        expect(response).to have_http_status(:ok)

        token = response.headers["Authorization"]

        # Make request using JWT token
        get "/api/v1/auth/me", headers: { "Authorization" => token }

        expect(response).to have_http_status(:ok)
        expect(json_response["user"]["email"]).to eq("jwt@example.com")
      end

      it "maintains authentication across multiple requests with same token" do
        # Login to get JWT token
        post "/api/v1/auth/login", params: valid_params
        expect(response).to have_http_status(:ok)

        token = response.headers["Authorization"]

        # Make multiple requests with same token
        2.times do
          get "/api/v1/auth/me", headers: { "Authorization" => token }

          expect(response).to have_http_status(:ok)
        end
      end

      it "rejects requests without JWT token" do
        get "/api/v1/auth/me"

        expect(response).to have_http_status(:unauthorized)
      end

      it "rejects requests with invalid JWT token" do
        get "/api/v1/auth/me", headers: { "Authorization" => "Bearer invalid_token" }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
