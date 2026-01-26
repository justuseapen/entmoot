# frozen_string_literal: true

require "rails_helper"

RSpec.describe GoalTrackabilityService do
  let(:user) { create(:user) }
  let(:family) { create(:family) }
  let(:goal) do
    create(:goal, family: family, creator: user, title: "Save $10,000 in emergency fund",
                  description: "Build up my emergency fund to cover 6 months of expenses")
  end
  let(:service) { described_class.new(goal) }

  describe "#assess" do
    let(:trackable_response) do
      <<~JSON
        {
          "is_trackable": true,
          "reason": "This financial goal can be tracked via Plaid integration for savings monitoring.",
          "potential_integrations": ["Plaid", "Personal Capital"]
        }
      JSON
    end

    let(:non_trackable_response) do
      <<~JSON
        {
          "is_trackable": false,
          "reason": "This goal requires manual progress tracking as there's no direct API integration available.",
          "potential_integrations": []
        }
      JSON
    end

    context "when goal is trackable" do
      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(trackable_response)
      end

      it "returns trackability assessment" do
        result = service.assess

        expect(result[:is_trackable]).to be true
        expect(result[:reason]).to include("Plaid")
        expect(result[:potential_integrations]).to include("Plaid")
      end
    end

    context "when goal is not trackable" do
      let(:goal) do
        create(:goal, family: family, creator: user, title: "Be more patient",
                      description: "Practice patience in daily situations")
      end

      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(non_trackable_response)
      end

      it "returns non-trackable assessment" do
        result = service.assess

        expect(result[:is_trackable]).to be false
        expect(result[:potential_integrations]).to be_empty
      end
    end

    context "with JSON in markdown code block" do
      before do
        wrapped_response = "```json\n#{trackable_response}\n```"
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(wrapped_response)
      end

      it "extracts and parses JSON correctly" do
        result = service.assess

        expect(result[:is_trackable]).to be true
      end
    end

    context "with missing fields in response" do
      let(:partial_response) do
        <<~JSON
          {
            "is_trackable": true
          }
        JSON
      end

      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(partial_response)
      end

      it "provides default values for missing fields" do
        result = service.assess

        expect(result[:is_trackable]).to be true
        expect(result[:reason]).to eq("No assessment provided.")
        expect(result[:potential_integrations]).to eq([])
      end
    end

    context "with invalid JSON response" do
      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return("This is not JSON")
      end

      it "raises AssessmentError" do
        expect do
          service.assess
        end.to raise_error(GoalTrackabilityService::AssessmentError, /Failed to parse/)
      end
    end

    context "when API client raises error" do
      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_raise(AnthropicClient::ApiError, "API Error")
      end

      it "raises AssessmentError" do
        expect do
          service.assess
        end.to raise_error(GoalTrackabilityService::AssessmentError, "API Error")
      end
    end

    context "with too many integrations" do
      let(:response_with_many_integrations) do
        integrations = (1..15).map { |i| "\"Integration#{i}\"" }.join(", ")
        <<~JSON
          {
            "is_trackable": true,
            "reason": "Multiple integrations possible",
            "potential_integrations": [#{integrations}]
          }
        JSON
      end

      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(response_with_many_integrations)
      end

      it "limits integrations to 10" do
        result = service.assess

        expect(result[:potential_integrations].length).to eq(10)
      end
    end
  end
end
