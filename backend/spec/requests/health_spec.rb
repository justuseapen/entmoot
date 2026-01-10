# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Health" do
  describe "GET /health" do
    it "returns ok status" do
      get "/health"

      expect(response).to have_http_status(:ok)
    end

    it "returns JSON with status ok" do
      get "/health"

      json_response = response.parsed_body
      expect(json_response["status"]).to eq("ok")
    end

    it "returns a timestamp" do
      get "/health"

      json_response = response.parsed_body
      expect(json_response["timestamp"]).to be_present
    end
  end
end
