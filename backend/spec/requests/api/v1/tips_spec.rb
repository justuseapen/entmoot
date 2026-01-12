# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Tips" do
  let(:user) { create(:user) }

  describe "GET /api/v1/users/me/tips" do
    context "when authenticated" do
      it "returns tips status" do
        get "/api/v1/users/me/tips", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["tips"]).to include(
          "tips_enabled" => true,
          "shown_tips" => [],
          "available_tips" => NotificationPreference::TIP_TYPES,
          "pending_tips" => NotificationPreference::TIP_TYPES
        )
      end

      it "creates notification preferences if not exists" do
        expect { get "/api/v1/users/me/tips", headers: auth_headers(user) }
          .to change(NotificationPreference, :count).by(1)
      end

      it "shows tips as disabled when tips_enabled is false" do
        NotificationPreference.find_or_create_for(user).update(tips_enabled: false)

        get "/api/v1/users/me/tips", headers: auth_headers(user)

        expect(json_response["tips"]["tips_enabled"]).to be(false)
      end

      it "shows shown_tips when some tips have been shown" do
        prefs = NotificationPreference.find_or_create_for(user)
        prefs.update(shown_tips: %w[goals_page first_reflection])

        get "/api/v1/users/me/tips", headers: auth_headers(user)

        expect(json_response["tips"]["shown_tips"]).to contain_exactly("goals_page", "first_reflection")
        expect(json_response["tips"]["pending_tips"]).to contain_exactly(
          "first_family_member", "first_daily_plan", "first_weekly_review"
        )
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        get "/api/v1/users/me/tips"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/users/me/tips/mark_shown" do
    context "when authenticated" do
      it "marks a valid tip as shown" do
        post "/api/v1/users/me/tips/mark_shown",
             params: { tip_type: "goals_page" },
             headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["tips"]["shown_tips"]).to include("goals_page")
      end

      it "adds tip to existing shown_tips" do
        prefs = NotificationPreference.find_or_create_for(user)
        prefs.update(shown_tips: ["first_reflection"])

        post "/api/v1/users/me/tips/mark_shown",
             params: { tip_type: "goals_page" },
             headers: auth_headers(user)

        expect(json_response["tips"]["shown_tips"]).to contain_exactly("first_reflection", "goals_page")
      end

      it "returns already_shown when tip was already shown" do
        prefs = NotificationPreference.find_or_create_for(user)
        prefs.update(shown_tips: ["goals_page"])

        post "/api/v1/users/me/tips/mark_shown",
             params: { tip_type: "goals_page" },
             headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["already_shown"]).to be(true)
      end

      it "returns error for invalid tip type" do
        post "/api/v1/users/me/tips/mark_shown",
             params: { tip_type: "invalid_tip" },
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to include("Invalid tip type: invalid_tip")
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        post "/api/v1/users/me/tips/mark_shown", params: { tip_type: "goals_page" }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "PATCH /api/v1/users/me/tips/toggle" do
    context "when authenticated" do
      it "disables tips" do
        NotificationPreference.find_or_create_for(user)

        patch "/api/v1/users/me/tips/toggle",
              params: { enabled: false },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["tips"]["tips_enabled"]).to be(false)
      end

      it "enables tips" do
        prefs = NotificationPreference.find_or_create_for(user)
        prefs.update(tips_enabled: false)

        patch "/api/v1/users/me/tips/toggle",
              params: { enabled: true },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["tips"]["tips_enabled"]).to be(true)
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        patch "/api/v1/users/me/tips/toggle", params: { enabled: false }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
