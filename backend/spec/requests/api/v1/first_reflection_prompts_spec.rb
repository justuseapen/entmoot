# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::FirstReflectionPrompts" do
  let(:user) { create(:user) }
  let(:family) { create(:family, timezone: "America/New_York") }

  before do
    create(:family_membership, user: user, family: family, role: :admin)
  end

  describe "GET /api/v1/users/me/first_reflection_prompt" do
    context "when authenticated" do
      context "with morning time (5am-12pm)" do
        it "returns morning prompt" do
          travel_to Time.zone.parse("2026-01-12 09:00:00 EST") do
            get "/api/v1/users/me/first_reflection_prompt", headers: auth_headers(user)

            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            expect(json["time_period"]).to eq("morning")
            expect(json["prompt"]["question"]).to eq("What's your top priority for today?")
            expect(json["should_show"]).to be true
          end
        end
      end

      context "with afternoon time (12pm-5pm)" do
        it "returns afternoon prompt" do
          travel_to Time.zone.parse("2026-01-12 14:00:00 EST") do
            get "/api/v1/users/me/first_reflection_prompt", headers: auth_headers(user)

            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            expect(json["time_period"]).to eq("afternoon")
            expect(json["prompt"]["question"]).to eq("What's one thing you want to accomplish before the day ends?")
          end
        end
      end

      context "with evening time (5pm-10pm)" do
        it "returns evening prompt" do
          travel_to Time.zone.parse("2026-01-12 19:00:00 EST") do
            get "/api/v1/users/me/first_reflection_prompt", headers: auth_headers(user)

            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            expect(json["time_period"]).to eq("evening")
            expect(json["prompt"]["question"]).to eq("What's one thing that went well today?")
          end
        end
      end

      context "with night time (10pm-5am)" do
        it "returns no prompt and should_show false" do
          travel_to Time.zone.parse("2026-01-12 23:00:00 EST") do
            get "/api/v1/users/me/first_reflection_prompt", headers: auth_headers(user)

            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            expect(json["time_period"]).to be_nil
            expect(json["prompt"]).to be_nil
            expect(json["should_show"]).to be false
          end
        end
      end

      context "when user has already created a reflection" do
        before { user.update!(first_reflection_created_at: 1.hour.ago) }

        it "returns should_show false" do
          travel_to Time.zone.parse("2026-01-12 09:00:00 EST") do
            get "/api/v1/users/me/first_reflection_prompt", headers: auth_headers(user)

            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            expect(json["should_show"]).to be false
            expect(json["first_reflection_created_at"]).to be_present
          end
        end
      end

      context "when user has dismissed the prompt recently" do
        before { user.update!(first_reflection_prompt_dismissed_at: 30.minutes.ago) }

        it "returns should_show false" do
          travel_to Time.zone.parse("2026-01-12 09:00:00 EST") do
            get "/api/v1/users/me/first_reflection_prompt", headers: auth_headers(user)

            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            expect(json["should_show"]).to be false
          end
        end
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/users/me/first_reflection_prompt"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/users/me/first_reflection_prompt/dismiss" do
    context "when authenticated" do
      it "dismisses the prompt" do
        expect { post "/api/v1/users/me/first_reflection_prompt/dismiss", headers: auth_headers(user) }
          .to change { user.reload.first_reflection_prompt_dismissed_at }.from(nil)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["dismissed"]).to be true
      end
    end
  end

  describe "POST /api/v1/users/me/first_reflection_prompt" do
    context "when authenticated" do
      let(:valid_params) { { response: "I want to spend quality time with my family today." } }

      context "with valid params" do
        it "creates a quick reflection" do
          travel_to Time.zone.parse("2026-01-12 09:00:00 EST") do
            expect do
              post "/api/v1/users/me/first_reflection_prompt", params: valid_params, headers: auth_headers(user)
            end
              .to change(Reflection, :count).by(1)

            expect(response).to have_http_status(:created)
            json = response.parsed_body
            expect(json["reflection_type"]).to eq("quick")
            expect(json["response"]).to eq(valid_params[:response])
          end
        end

        it "tracks first reflection created at" do
          travel_to Time.zone.parse("2026-01-12 09:00:00 EST") do
            expect do
              post "/api/v1/users/me/first_reflection_prompt", params: valid_params, headers: auth_headers(user)
            end
              .to change { user.reload.first_reflection_created_at }.from(nil)
          end
        end

        it "creates reflection with correct associations" do
          travel_to Time.zone.parse("2026-01-12 09:00:00 EST") do
            post "/api/v1/users/me/first_reflection_prompt", params: valid_params, headers: auth_headers(user)

            reflection = Reflection.last
            expect(reflection.user).to eq(user)
            expect(reflection.family).to eq(family)
            expect(reflection.daily_plan).to be_nil
            expect(reflection.quick?).to be true
          end
        end

        it "includes the prompt question in the response" do
          travel_to Time.zone.parse("2026-01-12 09:00:00 EST") do
            post "/api/v1/users/me/first_reflection_prompt", params: valid_params, headers: auth_headers(user)

            reflection = Reflection.last
            expect(reflection.reflection_responses.first.prompt).to eq("What's your top priority for today?")
          end
        end
      end

      context "with specific family_id" do
        let(:another_family) { create(:family) }

        before do
          create(:family_membership, user: user, family: another_family, role: :adult)
        end

        it "creates reflection in specified family" do
          travel_to Time.zone.parse("2026-01-12 09:00:00 EST") do
            post "/api/v1/users/me/first_reflection_prompt",
                 params: valid_params.merge(family_id: another_family.id),
                 headers: auth_headers(user)

            expect(response).to have_http_status(:created)
            reflection = Reflection.last
            expect(reflection.family).to eq(another_family)
          end
        end
      end

      context "when user has no family" do
        let(:solo_user) { create(:user) }

        it "returns error" do
          post "/api/v1/users/me/first_reflection_prompt", params: valid_params, headers: auth_headers(solo_user)

          expect(response).to have_http_status(:unprocessable_content)
          expect(response.parsed_body["error"]).to eq("User must belong to a family")
        end
      end

      context "when first reflection already tracked" do
        before { user.update!(first_reflection_created_at: 1.day.ago) }

        it "still creates reflection but does not update first_reflection_created_at" do
          travel_to Time.zone.parse("2026-01-12 09:00:00 EST") do
            original_time = user.first_reflection_created_at

            expect do
              post "/api/v1/users/me/first_reflection_prompt", params: valid_params, headers: auth_headers(user)
            end
              .to change(Reflection, :count).by(1)

            expect(user.reload.first_reflection_created_at).to eq(original_time)
          end
        end
      end
    end
  end
end
