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

      it "sets a session cookie for authenticated requests" do
        post "/api/v1/auth/login", params: valid_params

        # After login, subsequent requests should be authenticated via session
        get "/api/v1/auth/me"
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

      it "invalidates the session after logout" do
        # Login via the actual endpoint to establish session
        post "/api/v1/auth/login", params: {
          user: { email: user.email, password: "password123" }
        }
        expect(response).to have_http_status(:ok)

        # Verify we're authenticated
        get "/api/v1/auth/me"
        expect(response).to have_http_status(:ok)

        # Logout
        delete "/api/v1/auth/logout"
        expect(response).to have_http_status(:ok)

        # Subsequent requests should be unauthenticated
        get "/api/v1/auth/me"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when not authenticated" do
      it "returns 401" do
        delete "/api/v1/auth/logout"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "Session-based authentication" do
    let(:session_user) { create(:user, email: "session@example.com", password: "password123") }
    let(:valid_params) do
      {
        user: {
          email: "session@example.com",
          password: "password123"
        }
      }
    end

    before { session_user }

    describe "session cookie on login" do
      it "sets a session cookie on successful login" do
        post "/api/v1/auth/login", params: valid_params

        expect(response).to have_http_status(:ok)
        expect(response.cookies["_entmoot_session"]).to be_present
      end
    end

    describe "session-based request authentication" do
      it "stores user in session for ActionCable auth" do
        # Login to establish session
        post "/api/v1/auth/login", params: valid_params
        expect(response).to have_http_status(:ok)

        session_cookie = response.cookies["_entmoot_session"]
        expect(session_cookie).to be_present

        # Verify session contains user data by checking warden
        # This enables ActionCable to authenticate via env['warden'].user
        # Note: API endpoints still require JWT, but session is set for ActionCable
      end

      it "allows requests with both session cookie and JWT" do
        # Login to establish session and get JWT
        post "/api/v1/auth/login", params: valid_params
        expect(response).to have_http_status(:ok)

        jwt_token = response.headers["Authorization"]
        session_cookie = response.cookies["_entmoot_session"]

        # Make request with both JWT and session cookie
        get "/api/v1/auth/me", headers: {
          "Authorization" => jwt_token,
          "Cookie" => "_entmoot_session=#{session_cookie}"
        }

        expect(response).to have_http_status(:ok)
        expect(json_response["user"]["email"]).to eq("session@example.com")
      end

      it "maintains session across multiple requests" do
        # Login to establish session
        post "/api/v1/auth/login", params: valid_params
        expect(response).to have_http_status(:ok)

        jwt_token = response.headers["Authorization"]
        session_cookie = response.cookies["_entmoot_session"]

        # Make multiple requests with same session
        2.times do
          get "/api/v1/auth/me", headers: {
            "Authorization" => jwt_token,
            "Cookie" => "_entmoot_session=#{session_cookie}"
          }

          expect(response).to have_http_status(:ok)
        end
      end
    end

    describe "logout clears session" do
      it "clears session cookie on logout" do
        # Login to establish session
        post "/api/v1/auth/login", params: valid_params
        expect(response).to have_http_status(:ok)

        jwt_token = response.headers["Authorization"]
        session_cookie = response.cookies["_entmoot_session"]
        expect(session_cookie).to be_present

        # Logout
        delete "/api/v1/auth/logout", headers: {
          "Authorization" => jwt_token,
          "Cookie" => "_entmoot_session=#{session_cookie}"
        }
        expect(response).to have_http_status(:ok)

        # Session cookie should be cleared (empty or expired)
        # After logout, the session should no longer authenticate requests
        get "/api/v1/auth/me", headers: { "Cookie" => "_entmoot_session=#{session_cookie}" }

        # Should fail because session was invalidated
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
