# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth::Registrations" do
  describe "POST /api/v1/auth/register" do
    let(:valid_params) do
      {
        user: {
          email: "test@example.com",
          password: "password123",
          password_confirmation: "password123",
          name: "Test User"
        }
      }
    end

    context "with valid parameters" do
      it "creates a new user and returns 201" do
        expect do
          post "/api/v1/auth/register", params: valid_params
        end.to change(User, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response["message"]).to eq("Signed up successfully.")
        expect(json_response["user"]["email"]).to eq("test@example.com")
        expect(json_response["user"]["name"]).to eq("Test User")
      end

      it "returns a JWT token in the Authorization header" do
        post "/api/v1/auth/register", params: valid_params

        expect(response.headers["Authorization"]).to be_present
        expect(response.headers["Authorization"]).to start_with("Bearer ")
      end

      it "creates a user with an avatar_url when provided" do
        params_with_avatar = valid_params.deep_dup
        params_with_avatar[:user][:avatar_url] = "https://example.com/avatar.png"

        post "/api/v1/auth/register", params: params_with_avatar

        expect(response).to have_http_status(:created)
        expect(json_response["user"]["avatar_url"]).to eq("https://example.com/avatar.png")
      end
    end

    context "with invalid parameters" do
      it "returns 422 with friendly message when email is missing" do
        invalid_params = valid_params.deep_dup
        invalid_params[:user].delete(:email)

        post "/api/v1/auth/register", params: invalid_params

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to eq("Email is required.")
        expect(json_response["errors"]).to include("Email can't be blank")
      end

      it "returns 422 with friendly message when password is too short" do
        invalid_params = valid_params.deep_dup
        invalid_params[:user][:password] = "short"
        invalid_params[:user][:password_confirmation] = "short"

        post "/api/v1/auth/register", params: invalid_params

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to eq("Password must be at least 6 characters.")
        expect(json_response["errors"]).to include("Password is too short (minimum is 6 characters)")
      end

      it "returns 422 when passwords do not match" do
        invalid_params = valid_params.deep_dup
        invalid_params[:user][:password_confirmation] = "different"

        post "/api/v1/auth/register", params: invalid_params

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["errors"]).to include("Password confirmation doesn't match Password")
      end

      it "returns 422 with friendly message and suggestion when email is already taken" do
        create(:user, email: "test@example.com")

        post "/api/v1/auth/register", params: valid_params

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to eq("This email is already registered.")
        expect(json_response["suggestion"]).to eq("Try signing in instead.")
        expect(json_response["errors"]).to include("Email has already been taken")
      end

      it "returns 422 with friendly message when name is missing" do
        invalid_params = valid_params.deep_dup
        invalid_params[:user].delete(:name)

        post "/api/v1/auth/register", params: invalid_params

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to eq("Name is required.")
        expect(json_response["errors"]).to include("Name can't be blank")
      end
    end
  end
end
