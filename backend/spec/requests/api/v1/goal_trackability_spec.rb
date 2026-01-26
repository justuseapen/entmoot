# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Goals Trackability" do
  let(:user) { create(:user) }
  let(:family) { create(:family) }

  describe "POST /api/v1/families/:family_id/goals/assess_trackability" do
    context "when user can manage goals" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "enqueues batch assessment job" do
        expect do
          post "/api/v1/families/#{family.id}/goals/assess_trackability",
               headers: auth_headers(user)
        end.to have_enqueued_job(BatchTrackabilityAssessmentJob)

        expect(response).to have_http_status(:accepted)
        expect(json_response["message"]).to include("started")
      end

      it "passes force_reassess parameter" do
        expect do
          post "/api/v1/families/#{family.id}/goals/assess_trackability",
               params: { force_reassess: true },
               headers: auth_headers(user)
        end.to have_enqueued_job(BatchTrackabilityAssessmentJob)
          .with(family_id: family.id, user_id: user.id, force_reassess: true)
      end
    end

    context "when user is a regular member without manage permission" do
      before { create(:family_membership, :child, family: family, user: user) }

      it "returns forbidden" do
        post "/api/v1/families/#{family.id}/goals/assess_trackability",
             headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is not a family member" do
      it "returns not found" do
        post "/api/v1/families/#{family.id}/goals/assess_trackability",
             headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "trackability assessment in goal responses" do
    before { create(:family_membership, :admin, family: family, user: user) }

    it "includes trackability_assessment in goal response" do
      goal = create(:goal, :family_visible, family: family, creator: user,
                           trackable: true,
                           trackability_assessment: {
                             "reason" => "Trackable via Plaid",
                             "potential_integrations" => ["Plaid"],
                             "assessed_version" => 1
                           },
                           trackability_assessed_at: Time.current)

      get "/api/v1/families/#{family.id}/goals/#{goal.id}",
          headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["goal"]["trackable"]).to be true
      expect(json_response["goal"]["trackability_assessment"]["reason"]).to eq("Trackable via Plaid")
      expect(json_response["goal"]["trackability_assessment"]["potential_integrations"]).to include("Plaid")
      expect(json_response["goal"]["trackability_assessed_at"]).to be_present
    end

    it "includes null trackability fields when not assessed" do
      goal = create(:goal, :family_visible, family: family, creator: user)

      get "/api/v1/families/#{family.id}/goals/#{goal.id}",
          headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["goal"]["trackable"]).to be false
      expect(json_response["goal"]["trackability_assessment"]).to eq({})
      expect(json_response["goal"]["trackability_assessed_at"]).to be_nil
    end
  end
end
