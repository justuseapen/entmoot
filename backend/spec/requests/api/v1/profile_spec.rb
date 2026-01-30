# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Profile" do
  let(:user) { create(:user, password: "password123") }
  let(:headers) { auth_headers(user) }

  describe "PATCH /api/v1/users/me/profile" do
    context "when authenticated" do
      it "updates the user name" do
        patch "/api/v1/users/me/profile", params: { name: "New Name" }, headers: headers, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["user"]["name"]).to eq("New Name")
        expect(user.reload.name).to eq("New Name")
      end

      it "updates the avatar_url" do
        patch "/api/v1/users/me/profile",
              params: { avatar_url: "https://example.com/avatar.jpg" },
              headers: headers,
              as: :json

        expect(response).to have_http_status(:ok)
        expect(user.reload.avatar_url).to eq("https://example.com/avatar.jpg")
      end

      it "updates multiple fields at once" do
        patch "/api/v1/users/me/profile",
              params: { name: "Updated Name", avatar_url: "https://example.com/new.jpg" },
              headers: headers,
              as: :json

        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.name).to eq("Updated Name")
        expect(user.avatar_url).to eq("https://example.com/new.jpg")
      end

      it "returns error for blank name" do
        patch "/api/v1/users/me/profile", params: { name: "" }, headers: headers, as: :json

        expect(response).to have_http_status(:unprocessable_content)
        json = response.parsed_body
        expect(json["errors"]).to include("Name can't be blank")
      end

      it "returns the updated user data" do
        patch "/api/v1/users/me/profile", params: { name: "Test User" }, headers: headers, as: :json

        json = response.parsed_body
        expect(json["user"]).to include(
          "id" => user.id,
          "email" => user.email,
          "name" => "Test User"
        )
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        patch "/api/v1/users/me/profile", params: { name: "New Name" }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "PATCH /api/v1/users/me/password" do
    context "when authenticated" do
      it "updates the password with correct current password" do
        patch "/api/v1/users/me/password",
              params: {
                current_password: "password123",
                password: "newpassword456",
                password_confirmation: "newpassword456"
              },
              headers: headers,
              as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["message"]).to eq("Password updated successfully")
        expect(user.reload.valid_password?("newpassword456")).to be true
      end

      it "returns error for incorrect current password" do
        patch "/api/v1/users/me/password",
              params: {
                current_password: "wrongpassword",
                password: "newpassword456",
                password_confirmation: "newpassword456"
              },
              headers: headers,
              as: :json

        expect(response).to have_http_status(:unprocessable_content)
        json = response.parsed_body
        expect(json["error"]).to eq("Current password is incorrect")
      end

      it "returns error when password confirmation doesn't match" do
        patch "/api/v1/users/me/password",
              params: {
                current_password: "password123",
                password: "newpassword456",
                password_confirmation: "differentpassword"
              },
              headers: headers,
              as: :json

        expect(response).to have_http_status(:unprocessable_content)
        json = response.parsed_body
        expect(json["error"]).to eq("Password confirmation doesn't match")
      end

      it "returns error for too short password" do
        patch "/api/v1/users/me/password",
              params: {
                current_password: "password123",
                password: "short",
                password_confirmation: "short"
              },
              headers: headers,
              as: :json

        expect(response).to have_http_status(:unprocessable_content)
        json = response.parsed_body
        expect(json["errors"]).to include("Password is too short (minimum is 6 characters)")
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        patch "/api/v1/users/me/password",
              params: { current_password: "test", password: "test", password_confirmation: "test" },
              as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /api/v1/users/me" do
    context "when authenticated" do
      it "deletes the account with correct password" do
        delete "/api/v1/users/me", params: { password: "password123" }, headers: headers, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["message"]).to eq("Account deleted successfully")
        expect(User.find_by(id: user.id)).to be_nil
      end

      it "revokes all refresh tokens before deletion" do
        create_list(:refresh_token, 3, user: user)

        delete "/api/v1/users/me", params: { password: "password123" }, headers: headers, as: :json

        expect(response).to have_http_status(:ok)
        # Tokens are deleted with user due to dependent: :destroy
        expect(RefreshToken.where(user_id: user.id)).to be_empty
      end

      it "returns error for incorrect password" do
        delete "/api/v1/users/me", params: { password: "wrongpassword" }, headers: headers, as: :json

        expect(response).to have_http_status(:unprocessable_content)
        json = response.parsed_body
        expect(json["error"]).to eq("Password is incorrect")
        expect(User.find_by(id: user.id)).not_to be_nil
      end

      it "deletes associated data" do
        family = create(:family)
        create(:family_membership, user: user, family: family)
        create(:daily_plan, user: user, family: family)
        create(:notification, user: user)

        delete "/api/v1/users/me", params: { password: "password123" }, headers: headers, as: :json

        expect(response).to have_http_status(:ok)
        expect(FamilyMembership.where(user_id: user.id)).to be_empty
        expect(DailyPlan.where(user_id: user.id)).to be_empty
        expect(Notification.where(user_id: user.id)).to be_empty
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        delete "/api/v1/users/me", params: { password: "test" }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/users/me/export" do
    let(:family) { create(:family) }
    let(:membership) { create(:family_membership, user: user, family: family) }

    context "when authenticated" do
      it "returns user data export" do
        membership # ensure family membership exists
        get "/api/v1/users/me/export", headers: headers, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["user"]["email"]).to eq(user.email)
        expect(json["user"]["name"]).to eq(user.name)
        expect(json["exported_at"]).to be_present
      end

      it "includes family memberships" do
        membership # ensure family membership exists

        get "/api/v1/users/me/export", headers: headers, as: :json

        json = response.parsed_body
        expect(json["families"]).to be_an(Array)
        expect(json["families"].length).to eq(1)
        expect(json["families"][0]["family_name"]).to eq(family.name)
      end

      it "includes daily plans with tasks and priorities" do
        plan = create(:daily_plan, user: user, family: family)
        create(:daily_task, daily_plan: plan, title: "Test Task")
        create(:top_priority, daily_plan: plan, title: "Test Priority")

        get "/api/v1/users/me/export", headers: headers, as: :json

        json = response.parsed_body
        expect(json["daily_plans"]).to be_an(Array)
        expect(json["daily_plans"][0]["tasks"][0]["title"]).to eq("Test Task")
        expect(json["daily_plans"][0]["priorities"][0]["title"]).to eq("Test Priority")
      end

      it "includes notification preferences" do
        create(:notification_preference, user: user, morning_planning: true)

        get "/api/v1/users/me/export", headers: headers, as: :json

        json = response.parsed_body
        expect(json["notification_preferences"]["reminders"]["morning_planning"]["enabled"]).to be true
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        get "/api/v1/users/me/export", as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
