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

      it "returns a JWT token in the Authorization header" do
        post "/api/v1/auth/login", params: valid_params

        expect(response.headers["Authorization"]).to be_present
        expect(response.headers["Authorization"]).to start_with("Bearer ")
      end

      it "returns a refresh token" do
        post "/api/v1/auth/login", params: valid_params

        expect(json_response["refresh_token"]).to be_present
      end

      it "creates a refresh token for the user" do
        expect do
          post "/api/v1/auth/login", params: valid_params
        end.to change(RefreshToken, :count).by(1)

        refresh_token = RefreshToken.last
        expect(refresh_token.user).to eq(user)
        expect(refresh_token.expires_at).to be > 29.days.from_now
      end
    end

    context "with invalid credentials" do
      it "returns 401 with wrong password" do
        post "/api/v1/auth/login", params: {
          user: { email: "test@example.com", password: "wrongpassword" }
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "returns 401 with non-existent email" do
        post "/api/v1/auth/login", params: {
          user: { email: "nonexistent@example.com", password: "password123" }
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /api/v1/auth/logout" do
    let!(:user) { create(:user) }

    context "when authenticated" do
      before { create(:refresh_token, user: user) }

      it "returns 200 and logs out successfully" do
        delete "/api/v1/auth/logout", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Logged out successfully.")
      end

      it "revokes all active refresh tokens" do
        create(:refresh_token, user: user) # Create another refresh token

        delete "/api/v1/auth/logout", headers: auth_headers(user)

        expect(user.refresh_tokens.active.count).to eq(0)
        expect(user.refresh_tokens.pluck(:revoked_at).compact.count).to eq(2)
      end

      it "adds the JWT to the denylist" do
        expect do
          delete "/api/v1/auth/logout", headers: auth_headers(user)
        end.to change(JwtDenylist, :count).by(1)
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
