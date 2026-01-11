# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::ReflectionPrompts" do
  describe "GET /api/v1/reflection_prompts" do
    context "when not authenticated" do
      it "returns all prompts (public endpoint)" do
        get "/api/v1/reflection_prompts"

        expect(response).to have_http_status(:ok)
        prompts = json_response["prompts"]
        expect(prompts.keys).to contain_exactly("evening", "weekly", "monthly", "quarterly", "annual")
      end

      it "returns prompts for evening reflection" do
        get "/api/v1/reflection_prompts"

        evening_prompts = json_response["prompts"]["evening"]
        expect(evening_prompts).to be_an(Array)
        expect(evening_prompts.first["key"]).to eq("went_well")
        expect(evening_prompts.first["prompt"]).to eq("What went well today?")
      end
    end

    context "when filtering by type" do
      it "returns only prompts for specified type" do
        get "/api/v1/reflection_prompts", params: { type: "evening" }

        expect(response).to have_http_status(:ok)
        prompts = json_response["prompts"]
        expect(prompts).to be_an(Array)
        expect(prompts.length).to eq(4)
        expect(prompts.pluck("key")).to contain_exactly("went_well", "challenging", "learned", "tomorrow")
      end

      it "returns empty array for invalid type" do
        get "/api/v1/reflection_prompts", params: { type: "nonexistent" }

        expect(response).to have_http_status(:ok)
        expect(json_response["prompts"]).to eq([])
      end

      it "returns prompts for weekly reflection" do
        get "/api/v1/reflection_prompts", params: { type: "weekly" }

        prompts = json_response["prompts"]
        expect(prompts.length).to eq(4)
        expect(prompts.pluck("key")).to contain_exactly("wins", "challenges", "lessons", "priorities")
      end
    end

    context "when authenticated" do
      let(:user) { create(:user) }

      it "also works when authenticated" do
        get "/api/v1/reflection_prompts", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["prompts"]).to be_present
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
