# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Onboarding" do
  include AuthHelpers

  let(:user) { create(:user) }

  describe "GET /api/v1/onboarding/status" do
    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/onboarding/status"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      it "returns onboarding status for new user" do
        get "/api/v1/onboarding/status", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["completed"]).to be false
        expect(json_response["completed_at"]).to be_nil
        expect(json_response["current_step"]).to eq(1)
        expect(json_response["skipped_steps"]).to eq([])
        expect(json_response["has_family"]).to be false
        expect(json_response["has_goal"]).to be false
      end

      it "returns completed status when onboarding is done" do
        user.update!(onboarding_wizard_completed_at: 1.day.ago, onboarding_wizard_last_step: 6)

        get "/api/v1/onboarding/status", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["completed"]).to be true
        expect(json_response["current_step"]).to eq(6)
      end

      it "returns has_family true when user has a family" do
        family = create(:family)
        create(:family_membership, user: user, family: family)

        get "/api/v1/onboarding/status", headers: auth_headers(user)

        expect(json_response["has_family"]).to be true
      end

      it "returns has_goal true when user has created goals" do
        family = create(:family)
        create(:family_membership, user: user, family: family)
        create(:goal, creator: user, family: family)

        get "/api/v1/onboarding/status", headers: auth_headers(user)

        expect(json_response["has_goal"]).to be true
      end
    end
  end

  describe "POST /api/v1/onboarding/step/:step_name" do
    context "when not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/onboarding/step/welcome"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      it "returns error for invalid step" do
        post "/api/v1/onboarding/step/invalid", headers: auth_headers(user)

        expect(response).to have_http_status(:bad_request)
        expect(json_response["error"]).to include("Invalid step")
      end

      describe "welcome step" do
        it "saves challenge and advances step" do
          post "/api/v1/onboarding/step/welcome",
               params: { challenge: "Everyone's too busy - hard to sync" },
               headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["next_step"]).to eq(2)
          expect(user.reload.onboarding_challenge).to eq("Everyone's too busy - hard to sync")
          expect(user.onboarding_wizard_last_step).to eq(2)
        end
      end

      describe "family_basics step" do
        it "advances to next step" do
          post "/api/v1/onboarding/step/family_basics", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["next_step"]).to eq(3)
          expect(user.reload.onboarding_wizard_last_step).to eq(3)
        end
      end

      describe "big_goal step" do
        it "advances to next step" do
          post "/api/v1/onboarding/step/big_goal", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["next_step"]).to eq(4)
        end
      end

      describe "calendar step" do
        it "advances to next step" do
          post "/api/v1/onboarding/step/calendar", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["next_step"]).to eq(5)
        end
      end

      describe "invite step" do
        it "advances to next step" do
          post "/api/v1/onboarding/step/invite", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["next_step"]).to eq(6)
        end
      end

      describe "complete step" do
        it "marks onboarding as completed" do
          freeze_time do
            post "/api/v1/onboarding/step/complete", headers: auth_headers(user)

            expect(response).to have_http_status(:ok)
            expect(json_response["message"]).to eq("Onboarding completed!")
            expect(user.reload.onboarding_wizard_completed_at).to be_within(1.second).of(Time.current)
          end
        end
      end
    end
  end

  describe "POST /api/v1/onboarding/skip/:step_name" do
    context "when not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/onboarding/skip/big_goal"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      it "returns error for invalid step" do
        post "/api/v1/onboarding/skip/invalid", headers: auth_headers(user)

        expect(response).to have_http_status(:bad_request)
        expect(json_response["error"]).to include("Invalid step")
      end

      it "returns error when trying to skip required step" do
        post "/api/v1/onboarding/skip/welcome", headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["error"]).to include("Cannot skip required step")
      end

      it "skips optional step and advances" do
        post "/api/v1/onboarding/skip/big_goal", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["skipped_steps"]).to include("big_goal")
        expect(user.reload.onboarding_skipped_steps).to include("big_goal")
      end

      it "does not duplicate skipped steps" do
        user.update!(onboarding_skipped_steps: ["big_goal"])

        post "/api/v1/onboarding/skip/big_goal", headers: auth_headers(user)

        expect(user.reload.onboarding_skipped_steps.count("big_goal")).to eq(1)
      end
    end
  end

  describe "POST /api/v1/onboarding/auto_complete" do
    context "when not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/onboarding/auto_complete"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      it "returns error when user has no family" do
        post "/api/v1/onboarding/auto_complete", headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["error"]).to include("missing family or goals")
      end

      it "returns error when user has family but no goals" do
        family = create(:family)
        create(:family_membership, user: user, family: family)

        post "/api/v1/onboarding/auto_complete", headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["error"]).to include("missing family or goals")
      end

      it "auto-completes onboarding when user has both family and goals" do
        family = create(:family)
        create(:family_membership, user: user, family: family)
        create(:goal, creator: user, family: family)

        freeze_time do
          post "/api/v1/onboarding/auto_complete", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["message"]).to eq("Onboarding auto-completed")
          expect(user.reload.onboarding_wizard_completed_at).to be_within(1.second).of(Time.current)
          expect(user.onboarding_wizard_last_step).to eq(6)
        end
      end
    end
  end

  describe "POST /api/v1/calendar_waitlist" do
    context "when not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/calendar_waitlist", params: { provider: "apple" }
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      it "returns error for invalid provider" do
        post "/api/v1/calendar_waitlist", params: { provider: "invalid" }, headers: auth_headers(user)

        expect(response).to have_http_status(:bad_request)
        expect(json_response["error"]).to include("Invalid provider")
      end

      it "adds user to apple calendar waitlist" do
        freeze_time do
          post "/api/v1/calendar_waitlist", params: { provider: "apple" }, headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["message"]).to include("Apple Calendar waitlist")
          expect(user.reload.calendar_waitlist["apple"]).to be_present
        end
      end

      it "adds user to microsoft calendar waitlist" do
        post "/api/v1/calendar_waitlist", params: { provider: "microsoft" }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to include("Microsoft Calendar waitlist")
        expect(user.reload.calendar_waitlist["microsoft"]).to be_present
      end

      it "allows user to join multiple waitlists" do
        post "/api/v1/calendar_waitlist", params: { provider: "apple" }, headers: auth_headers(user)
        post "/api/v1/calendar_waitlist", params: { provider: "microsoft" }, headers: auth_headers(user)

        expect(user.reload.calendar_waitlist.keys).to contain_exactly("apple", "microsoft")
      end
    end
  end

  private

  def json_response
    response.parsed_body
  end
end
