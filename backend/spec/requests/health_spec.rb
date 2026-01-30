# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Health" do
  describe "GET /health" do
    before do
      # Stub health checks to always pass in tests
      allow_any_instance_of(HealthController).to receive(:check_database).and_return(
        { healthy: true, message: "Connected" }
      )
      allow_any_instance_of(HealthController).to receive(:check_redis).and_return(
        { healthy: true, message: "Connected" }
      )
      allow_any_instance_of(HealthController).to receive(:check_sidekiq).and_return(
        { healthy: true, message: "1 process(es) running" }
      )
    end

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
