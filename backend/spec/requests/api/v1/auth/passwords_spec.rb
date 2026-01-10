# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth::Passwords" do
  describe "POST /api/v1/auth/password" do
    let!(:user) { create(:user, email: "test@example.com") }

    context "with valid email" do
      it "returns 200 and sends password reset instructions" do
        post "/api/v1/auth/password", params: { user: { email: "test@example.com" } }

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Password reset instructions have been sent to your email.")
      end

      it "generates a reset password token for the user" do
        post "/api/v1/auth/password", params: { user: { email: "test@example.com" } }

        user.reload
        expect(user.reset_password_token).to be_present
        expect(user.reset_password_sent_at).to be_present
      end
    end

    context "with non-existent email" do
      it "returns 422 with error message" do
        post "/api/v1/auth/password", params: { user: { email: "nonexistent@example.com" } }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to eq("Unable to send password reset instructions.")
        expect(json_response["errors"]).to include("Email not found")
      end
    end

    context "with blank email" do
      it "returns 422 with error message" do
        post "/api/v1/auth/password", params: { user: { email: "" } }

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "PUT /api/v1/auth/password" do
    let!(:user) { create(:user, email: "test@example.com") }
    let!(:reset_token) { user.send_reset_password_instructions }

    context "with valid token and password" do
      it "returns 200 and resets the password" do
        put "/api/v1/auth/password", params: {
          user: {
            reset_password_token: reset_token,
            password: "newpassword123",
            password_confirmation: "newpassword123"
          }
        }

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Password has been reset successfully.")
      end

      it "allows login with new password" do
        put "/api/v1/auth/password", params: {
          user: {
            reset_password_token: reset_token,
            password: "newpassword123",
            password_confirmation: "newpassword123"
          }
        }

        post "/api/v1/auth/login", params: {
          user: { email: "test@example.com", password: "newpassword123" }
        }

        expect(response).to have_http_status(:ok)
      end
    end

    context "with invalid token" do
      it "returns 422 with error message" do
        put "/api/v1/auth/password", params: {
          user: {
            reset_password_token: "invalid_token",
            password: "newpassword123",
            password_confirmation: "newpassword123"
          }
        }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to eq("Unable to reset password.")
        expect(json_response["errors"]).to include("Reset password token is invalid")
      end
    end

    context "with passwords that do not match" do
      it "returns 422 with error message" do
        put "/api/v1/auth/password", params: {
          user: {
            reset_password_token: reset_token,
            password: "newpassword123",
            password_confirmation: "differentpassword"
          }
        }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["errors"]).to include("Password confirmation doesn't match Password")
      end
    end

    context "with password too short" do
      it "returns 422 with error message" do
        put "/api/v1/auth/password", params: {
          user: {
            reset_password_token: reset_token,
            password: "short",
            password_confirmation: "short"
          }
        }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["errors"]).to include("Password is too short (minimum is 6 characters)")
      end
    end
  end
end
