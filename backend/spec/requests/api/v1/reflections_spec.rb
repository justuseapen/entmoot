# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Reflections" do
  let(:user) { create(:user) }
  let(:family) { create(:family, timezone: "America/New_York") }
  let(:daily_plan) { create(:daily_plan, user: user, family: family) }

  before { create(:family_membership, :adult, family: family, user: user) }

  describe "GET /api/v1/families/:family_id/reflections" do
    context "when user is authenticated and a family member" do
      it "returns all reflections for the family" do
        reflection1 = create(:reflection, :evening, daily_plan: daily_plan)
        reflection2 = create(:reflection, :weekly, daily_plan: daily_plan)

        get "/api/v1/families/#{family.id}/reflections", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["reflections"].length).to eq(2)
        expect(json_response["reflections"].pluck("id")).to contain_exactly(reflection1.id, reflection2.id)
      end

      it "includes reflection responses in the response" do
        create(:reflection, :with_responses, daily_plan: daily_plan)

        get "/api/v1/families/#{family.id}/reflections", headers: auth_headers(user)

        responses = json_response["reflections"].first["reflection_responses"]
        expect(responses.length).to eq(2)
      end

      it "includes user information" do
        create(:reflection, daily_plan: daily_plan)

        get "/api/v1/families/#{family.id}/reflections", headers: auth_headers(user)

        user_data = json_response["reflections"].first["user"]
        expect(user_data["id"]).to eq(user.id)
        expect(user_data["name"]).to eq(user.name)
      end

      it "filters by reflection type" do
        create(:reflection, :evening, daily_plan: daily_plan)
        weekly = create(:reflection, :weekly, daily_plan: daily_plan)

        get "/api/v1/families/#{family.id}/reflections", params: { type: "weekly" }, headers: auth_headers(user)

        expect(json_response["reflections"].length).to eq(1)
        expect(json_response["reflections"].first["id"]).to eq(weekly.id)
      end

      it "filters by user_id" do
        other_user = create(:user)
        create(:family_membership, :adult, family: family, user: other_user)
        other_plan = create(:daily_plan, user: other_user, family: family, date: Time.zone.yesterday)

        create(:reflection, daily_plan: daily_plan)
        other_reflection = create(:reflection, daily_plan: other_plan)

        get "/api/v1/families/#{family.id}/reflections",
            params: { user_id: other_user.id },
            headers: auth_headers(user)

        expect(json_response["reflections"].length).to eq(1)
        expect(json_response["reflections"].first["id"]).to eq(other_reflection.id)
      end

      it "filters by date range" do
        old_plan = create(:daily_plan, user: user, family: family, date: 7.days.ago)
        recent_plan = create(:daily_plan, user: user, family: family, date: 2.days.ago)

        create(:reflection, daily_plan: old_plan)
        recent = create(:reflection, daily_plan: recent_plan)

        get "/api/v1/families/#{family.id}/reflections",
            params: { from: 3.days.ago.to_date, to: Time.zone.today },
            headers: auth_headers(user)

        expect(json_response["reflections"].length).to eq(1)
        expect(json_response["reflections"].first["id"]).to eq(recent.id)
      end

      it "orders by date descending" do
        old_plan = create(:daily_plan, user: user, family: family, date: 3.days.ago)
        recent_plan = create(:daily_plan, user: user, family: family, date: 1.day.ago)

        old_reflection = create(:reflection, daily_plan: old_plan)
        recent_reflection = create(:reflection, daily_plan: recent_plan)

        get "/api/v1/families/#{family.id}/reflections", headers: auth_headers(user)

        ids = json_response["reflections"].pluck("id")
        expect(ids).to eq([recent_reflection.id, old_reflection.id])
      end

      it "includes completed status" do
        create(:reflection, :completed, daily_plan: daily_plan)

        get "/api/v1/families/#{family.id}/reflections", headers: auth_headers(user)

        expect(json_response["reflections"].first["completed"]).to be(true)
      end
    end

    context "when user is not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        get "/api/v1/families/#{other_family.id}/reflections", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/families/#{family.id}/reflections"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/reflections/:id" do
    let(:reflection) { create(:reflection, :with_mood, :with_energy, :with_gratitude, daily_plan: daily_plan) }

    context "when viewing own reflection" do
      it "returns the reflection" do
        get "/api/v1/families/#{family.id}/reflections/#{reflection.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(reflection.id)
        expect(json_response["reflection_type"]).to eq("evening")
      end

      it "includes mood and energy level" do
        get "/api/v1/families/#{family.id}/reflections/#{reflection.id}", headers: auth_headers(user)

        expect(json_response["mood"]).to eq("good")
        expect(json_response["energy_level"]).to eq(4)
        expect(json_response["gratitude_items"]).to eq(["Family", "Health", "Good weather"])
      end
    end

    context "when viewing another family member's reflection" do
      let(:other_user) { create(:user) }
      let(:other_plan) { create(:daily_plan, user: other_user, family: family, date: Time.zone.yesterday) }
      let(:other_reflection) { create(:reflection, daily_plan: other_plan) }

      before { create(:family_membership, :adult, family: family, user: other_user) }

      it "returns the reflection" do
        get "/api/v1/families/#{family.id}/reflections/#{other_reflection.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(other_reflection.id)
      end
    end

    context "when reflection does not exist" do
      it "returns not found" do
        get "/api/v1/families/#{family.id}/reflections/999999", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "POST /api/v1/families/:family_id/reflections" do
    context "when creating with existing daily plan" do
      it "creates a new reflection" do
        expect do
          post "/api/v1/families/#{family.id}/reflections",
               params: { daily_plan_id: daily_plan.id, reflection: { reflection_type: "evening" } },
               headers: auth_headers(user)
        end.to change(Reflection, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response["message"]).to eq("Reflection created successfully.")
        expect(json_response["reflection"]["reflection_type"]).to eq("evening")
      end

      it "creates reflection with mood and energy" do
        post "/api/v1/families/#{family.id}/reflections",
             params: {
               daily_plan_id: daily_plan.id,
               reflection: {
                 reflection_type: "evening",
                 mood: "good",
                 energy_level: 4
               }
             },
             headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        expect(json_response["reflection"]["mood"]).to eq("good")
        expect(json_response["reflection"]["energy_level"]).to eq(4)
      end

      it "creates reflection with gratitude items" do
        post "/api/v1/families/#{family.id}/reflections",
             params: {
               daily_plan_id: daily_plan.id,
               reflection: {
                 reflection_type: "evening",
                 gratitude_items: %w[Family Health Friends]
               }
             },
             headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        expect(json_response["reflection"]["gratitude_items"]).to eq(%w[Family Health Friends])
      end

      it "creates reflection with nested responses" do
        post "/api/v1/families/#{family.id}/reflections",
             params: {
               daily_plan_id: daily_plan.id,
               reflection: {
                 reflection_type: "evening",
                 reflection_responses_attributes: [
                   { prompt: "What went well?", response: "Got a lot done today!" },
                   { prompt: "What was challenging?", response: "Morning meeting ran long." }
                 ]
               }
             },
             headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        expect(json_response["reflection"]["reflection_responses"].length).to eq(2)
      end
    end

    context "when creating without daily plan (auto-creates today's plan)" do
      it "creates daily plan and reflection" do
        expect do
          post "/api/v1/families/#{family.id}/reflections",
               params: { reflection: { reflection_type: "evening" } },
               headers: auth_headers(user)
        end.to change(Reflection, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end

    context "with invalid data" do
      it "returns errors for invalid reflection type" do
        post "/api/v1/families/#{family.id}/reflections",
             params: { daily_plan_id: daily_plan.id, reflection: { reflection_type: "invalid_type" } },
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to include("Reflection type is not included in the list")
      end

      it "returns errors for duplicate reflection type" do
        create(:reflection, :evening, daily_plan: daily_plan)

        post "/api/v1/families/#{family.id}/reflections",
             params: { daily_plan_id: daily_plan.id, reflection: { reflection_type: "evening" } },
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to include("Reflection type already has a reflection of this type for this day")
      end

      it "returns errors for invalid energy level" do
        post "/api/v1/families/#{family.id}/reflections",
             params: {
               daily_plan_id: daily_plan.id,
               reflection: { reflection_type: "evening", energy_level: 10 }
             },
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context "when not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        post "/api/v1/families/#{other_family.id}/reflections",
             params: { reflection: { reflection_type: "evening" } },
             headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH /api/v1/families/:family_id/reflections/:id" do
    let(:reflection) { create(:reflection, daily_plan: daily_plan) }

    context "when updating own reflection" do
      it "updates mood" do
        patch "/api/v1/families/#{family.id}/reflections/#{reflection.id}",
              params: { reflection: { mood: "great" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Reflection updated successfully.")
        expect(json_response["reflection"]["mood"]).to eq("great")
      end

      it "updates energy level" do
        patch "/api/v1/families/#{family.id}/reflections/#{reflection.id}",
              params: { reflection: { energy_level: 5 } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["reflection"]["energy_level"]).to eq(5)
      end

      it "updates gratitude items" do
        patch "/api/v1/families/#{family.id}/reflections/#{reflection.id}",
              params: { reflection: { gratitude_items: %w[Sunshine Coffee] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["reflection"]["gratitude_items"]).to eq(%w[Sunshine Coffee])
      end

      it "adds reflection responses" do
        patch "/api/v1/families/#{family.id}/reflections/#{reflection.id}",
              params: {
                reflection: {
                  reflection_responses_attributes: [
                    { prompt: "What went well?", response: "Great day!" }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["reflection"]["reflection_responses"].length).to eq(1)
      end

      it "updates existing reflection responses" do
        response_record = create(:reflection_response, reflection: reflection, prompt: "What went well?",
                                                       response: "OK")

        patch "/api/v1/families/#{family.id}/reflections/#{reflection.id}",
              params: {
                reflection: {
                  reflection_responses_attributes: [
                    { id: response_record.id, response: "Actually great!" }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["reflection"]["reflection_responses"].first["response"]).to eq("Actually great!")
      end

      it "removes reflection responses" do
        response_record = create(:reflection_response, reflection: reflection)

        patch "/api/v1/families/#{family.id}/reflections/#{reflection.id}",
              params: {
                reflection: {
                  reflection_responses_attributes: [
                    { id: response_record.id, _destroy: true }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["reflection"]["reflection_responses"]).to be_empty
      end
    end

    context "when trying to update another user's reflection" do
      let(:other_user) { create(:user) }
      let(:other_plan) { create(:daily_plan, user: other_user, family: family, date: Time.zone.yesterday) }
      let(:other_reflection) { create(:reflection, daily_plan: other_plan) }

      before { create(:family_membership, :adult, family: family, user: other_user) }

      it "returns forbidden" do
        patch "/api/v1/families/#{family.id}/reflections/#{other_reflection.id}",
              params: { reflection: { mood: "rough" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/families/:family_id/reflections/:id" do
    let!(:reflection) { create(:reflection, daily_plan: daily_plan) }

    context "when deleting own reflection" do
      it "deletes the reflection" do
        expect do
          delete "/api/v1/families/#{family.id}/reflections/#{reflection.id}", headers: auth_headers(user)
        end.to change(Reflection, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Reflection deleted successfully.")
      end

      it "also deletes associated responses" do
        create(:reflection_response, reflection: reflection)

        expect do
          delete "/api/v1/families/#{family.id}/reflections/#{reflection.id}", headers: auth_headers(user)
        end.to change(ReflectionResponse, :count).by(-1)
      end
    end

    context "when trying to delete another user's reflection" do
      let(:other_user) { create(:user) }
      let(:other_plan) { create(:daily_plan, user: other_user, family: family, date: Time.zone.yesterday) }
      let!(:other_reflection) { create(:reflection, daily_plan: other_plan) }

      before { create(:family_membership, :adult, family: family, user: other_user) }

      it "returns forbidden" do
        delete "/api/v1/families/#{family.id}/reflections/#{other_reflection.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
