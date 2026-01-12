# frozen_string_literal: true

require "rails_helper"

RSpec.describe GoalRefinementService do
  let(:user) { create(:user) }
  let(:family) { create(:family) }
  let(:goal) do
    create(:goal, :with_smart, family: family, creator: user, title: "Learn Spanish",
                               description: "I want to become fluent in Spanish")
  end
  let(:service) { described_class.new(goal) }

  describe "#refine" do
    let(:valid_ai_response) do
      <<~JSON
        {
          "smart_suggestions": {
            "specific": "Define which aspect of Spanish to focus on",
            "measurable": "Set a target vocabulary count or CEFR level",
            "achievable": "Start with 15-30 minutes daily",
            "relevant": "Consider career or travel benefits",
            "time_bound": "Set a 6-month checkpoint"
          },
          "alternative_titles": [
            "Achieve B2 Spanish Fluency",
            "Master Conversational Spanish"
          ],
          "alternative_descriptions": [
            "Develop Spanish speaking skills for everyday situations"
          ],
          "potential_obstacles": [
            {"obstacle": "Inconsistent practice", "mitigation": "Set daily reminders"},
            {"obstacle": "Limited speaking opportunities", "mitigation": "Join language exchanges"}
          ],
          "milestones": [
            {"title": "Complete A1", "description": "Basic vocabulary", "suggested_progress": 25},
            {"title": "Complete A2", "description": "Simple conversations", "suggested_progress": 50},
            {"title": "Complete B1", "description": "Independent user", "suggested_progress": 75},
            {"title": "Complete B2", "description": "Upper intermediate", "suggested_progress": 100}
          ],
          "overall_feedback": "Great goal! Adding specific metrics will help track progress."
        }
      JSON
    end

    context "with successful API response" do
      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(valid_ai_response)
      end

      it "returns parsed suggestions" do
        result = service.refine

        expect(result).to be_a(Hash)
        expect(result[:smart_suggestions]).to be_present
        expect(result[:alternative_titles]).to be_an(Array)
        expect(result[:potential_obstacles]).to be_an(Array)
        expect(result[:milestones]).to be_an(Array)
        expect(result[:overall_feedback]).to be_present
      end

      it "includes all SMART suggestions" do
        result = service.refine

        expect(result[:smart_suggestions]).to include(
          specific: "Define which aspect of Spanish to focus on",
          measurable: "Set a target vocabulary count or CEFR level",
          achievable: "Start with 15-30 minutes daily",
          relevant: "Consider career or travel benefits",
          time_bound: "Set a 6-month checkpoint"
        )
      end

      it "includes alternative titles limited to 5" do
        result = service.refine

        expect(result[:alternative_titles].length).to be <= 5
        expect(result[:alternative_titles]).to include("Achieve B2 Spanish Fluency")
      end

      it "includes alternative descriptions limited to 3" do
        result = service.refine

        expect(result[:alternative_descriptions].length).to be <= 3
      end

      it "includes potential obstacles with mitigations" do
        result = service.refine

        expect(result[:potential_obstacles].first).to include(
          obstacle: "Inconsistent practice",
          mitigation: "Set daily reminders"
        )
      end

      it "includes milestones with progress percentages" do
        result = service.refine

        milestone = result[:milestones].first
        expect(milestone[:title]).to eq("Complete A1")
        expect(milestone[:suggested_progress]).to eq(25)
      end

      it "clamps milestone progress to 0-100 range" do
        response_with_invalid_progress = valid_ai_response.gsub('"suggested_progress": 25', '"suggested_progress": 150')
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(response_with_invalid_progress)

        result = service.refine

        expect(result[:milestones].first[:suggested_progress]).to eq(100)
      end
    end

    context "with JSON in markdown code block" do
      before do
        wrapped_response = "```json\n#{valid_ai_response}\n```"
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(wrapped_response)
      end

      it "extracts and parses JSON correctly" do
        result = service.refine

        expect(result[:smart_suggestions]).to be_present
        expect(result[:alternative_titles]).to be_present
      end
    end

    context "with generic code block" do
      before do
        wrapped_response = "```\n#{valid_ai_response}\n```"
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(wrapped_response)
      end

      it "extracts and parses JSON correctly" do
        result = service.refine

        expect(result[:smart_suggestions]).to be_present
      end
    end

    context "with partial/missing data in response" do
      let(:partial_response) do
        <<~JSON
          {
            "smart_suggestions": {
              "specific": "Be more specific"
            },
            "alternative_titles": ["New Title"],
            "overall_feedback": "Good start!"
          }
        JSON
      end

      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(partial_response)
      end

      it "handles missing arrays gracefully" do
        result = service.refine

        expect(result[:alternative_descriptions]).to eq([])
        expect(result[:potential_obstacles]).to eq([])
        expect(result[:milestones]).to eq([])
      end

      it "handles partial SMART suggestions" do
        result = service.refine

        expect(result[:smart_suggestions][:specific]).to eq("Be more specific")
        expect(result[:smart_suggestions][:measurable]).to be_nil
      end
    end

    context "with invalid JSON response" do
      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return("This is not JSON")
      end

      it "raises RefinementError" do
        expect do
          service.refine
        end.to raise_error(GoalRefinementService::RefinementError, /Failed to parse/)
      end
    end

    context "when API client raises error" do
      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_raise(AnthropicClient::RateLimitError, "Rate limited")
      end

      it "raises RefinementError" do
        expect do
          service.refine
        end.to raise_error(GoalRefinementService::RefinementError, "Rate limited")
      end
    end

    context "with goal without SMART fields" do
      let(:minimal_goal) { create(:goal, family: family, creator: user, title: "Simple goal") }
      let(:minimal_service) { described_class.new(minimal_goal) }

      it "includes 'Not defined' for missing SMART fields in prompt" do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)

        allow(mock_client).to receive(:chat) do |args|
          expect(args[:messages].first[:content]).to include("Not defined")
          valid_ai_response
        end

        minimal_service.refine
      end
    end
  end
end
