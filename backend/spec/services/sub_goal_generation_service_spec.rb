# frozen_string_literal: true

require "rails_helper"

RSpec.describe SubGoalGenerationService do
  let(:user) { create(:user) }
  let(:family) { create(:family) }
  let(:goal) do
    create(:goal, family: family, creator: user,
                  title: "Get pilot's license",
                  description: "I want to become a licensed private pilot",
                  time_scale: :annual,
                  due_date: 1.year.from_now.to_date)
  end
  let(:service) { described_class.new(goal) }

  describe "#generate" do
    let(:valid_ai_response) do
      <<~JSON
        {
          "sub_goals": [
            {
              "title": "Get FAA medical certificate",
              "description": "Schedule and complete FAA Third Class Medical exam",
              "time_scale": "monthly",
              "suggested_progress": 10,
              "due_date_percent": 10,
              "order": 1,
              "smart_fields": {
                "specific": "Schedule appointment with AME and complete exam",
                "measurable": "Certificate issued",
                "achievable": "Most people pass on first attempt",
                "relevant": "Required before solo flight",
                "time_bound": "Complete within first month"
              }
            },
            {
              "title": "Complete ground school",
              "description": "Finish FAA written exam prep course",
              "time_scale": "quarterly",
              "suggested_progress": 25,
              "due_date_percent": 25,
              "order": 2,
              "smart_fields": {
                "specific": "Complete online ground school course",
                "measurable": "Pass all module quizzes",
                "achievable": "2-3 hours study per week",
                "relevant": "Knowledge base for written exam",
                "time_bound": "Within first 3 months"
              }
            },
            {
              "title": "Pass FAA written exam",
              "description": "Score 70% or higher on FAA knowledge test",
              "time_scale": "monthly",
              "suggested_progress": 35,
              "due_date_percent": 35,
              "order": 3,
              "smart_fields": {
                "specific": "Pass FAA Private Pilot Knowledge Test",
                "measurable": "Score >= 70%",
                "achievable": "After completing ground school",
                "relevant": "Required for checkride",
                "time_bound": "After ground school completion"
              }
            },
            {
              "title": "Solo flight",
              "description": "Complete first supervised solo flight",
              "time_scale": "quarterly",
              "suggested_progress": 60,
              "due_date_percent": 60,
              "order": 4,
              "smart_fields": {
                "specific": "Complete pattern work solo",
                "measurable": "Logbook endorsement from CFI",
                "achievable": "After 15-20 hours dual instruction",
                "relevant": "Major milestone in training",
                "time_bound": "Within 6 months"
              }
            },
            {
              "title": "Pass practical checkride",
              "description": "Complete oral exam and flight test with DPE",
              "time_scale": "quarterly",
              "suggested_progress": 100,
              "due_date_percent": 95,
              "order": 5,
              "smart_fields": {
                "specific": "Pass practical test with Designated Pilot Examiner",
                "measurable": "Certificate issued",
                "achievable": "After 40+ hours flight time",
                "relevant": "Final step to certification",
                "time_bound": "Within target year"
              }
            }
          ],
          "domain_insights": "Private pilot training typically takes 3-6 months for most students with regular training schedule.",
          "total_duration_estimate": "4-8 months with consistent training"
        }
      JSON
    end

    context "with successful API response" do
      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(valid_ai_response)
      end

      it "returns parsed sub-goal suggestions" do
        result = service.generate

        expect(result).to be_a(Hash)
        expect(result[:sub_goals]).to be_an(Array)
        expect(result[:sub_goals].length).to eq(5)
        expect(result[:domain_insights]).to be_present
      end

      it "includes all required sub-goal fields" do
        result = service.generate
        sub_goal = result[:sub_goals].first

        expect(sub_goal[:title]).to eq("Get FAA medical certificate")
        expect(sub_goal[:description]).to be_present
        expect(sub_goal[:time_scale]).to eq("monthly")
        expect(sub_goal[:suggested_progress]).to eq(10)
        expect(sub_goal[:order]).to eq(1)
      end

      it "calculates due dates based on parent goal" do
        result = service.generate
        sub_goal = result[:sub_goals].first

        # First sub-goal has 10% offset, so due date should be ~10% of the way to parent due date
        expected_days = ((goal.due_date - Date.current).to_i * 0.1).round
        expected_date = Date.current + expected_days

        expect(sub_goal[:due_date]).to eq(expected_date)
      end

      it "includes SMART fields for each sub-goal" do
        result = service.generate
        smart_fields = result[:sub_goals].first[:smart_fields]

        expect(smart_fields[:specific]).to be_present
        expect(smart_fields[:measurable]).to be_present
        expect(smart_fields[:achievable]).to be_present
        expect(smart_fields[:relevant]).to be_present
        expect(smart_fields[:time_bound]).to be_present
      end

      it "orders sub-goals by order field" do
        result = service.generate
        orders = result[:sub_goals].map { |sg| sg[:order] }

        expect(orders).to eq([1, 2, 3, 4, 5])
      end

      it "limits sub-goals to 8" do
        response_with_many = valid_ai_response.gsub(
          '"sub_goals": [',
          '"sub_goals": [' + (0..9).map { |i| '{"title": "Goal #{i}", "order": #{i}}' }.join(",") + ","
        )
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(valid_ai_response)

        result = service.generate

        expect(result[:sub_goals].length).to be <= 8
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
        result = service.generate

        expect(result[:sub_goals]).to be_present
        expect(result[:sub_goals].length).to eq(5)
      end
    end

    context "with annual goal" do
      it "allows quarterly and monthly sub-goals" do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(valid_ai_response)

        result = service.generate

        time_scales = result[:sub_goals].map { |sg| sg[:time_scale] }
        expect(time_scales).to all(be_in(%w[quarterly monthly]))
      end
    end

    context "with quarterly goal" do
      let(:quarterly_goal) do
        create(:goal, family: family, creator: user,
                      title: "Complete Q1 objectives",
                      time_scale: :quarterly,
                      due_date: 3.months.from_now.to_date)
      end
      let(:quarterly_service) { described_class.new(quarterly_goal) }

      let(:quarterly_response) do
        <<~JSON
          {
            "sub_goals": [
              {"title": "Week 1-4 tasks", "time_scale": "weekly", "order": 1, "due_date_percent": 30},
              {"title": "Month 2 goals", "time_scale": "monthly", "order": 2, "due_date_percent": 60}
            ],
            "domain_insights": "Quarterly goals work best with monthly and weekly milestones"
          }
        JSON
      end

      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(quarterly_response)
      end

      it "allows monthly and weekly sub-goals" do
        result = quarterly_service.generate

        time_scales = result[:sub_goals].map { |sg| sg[:time_scale] }
        expect(time_scales).to all(be_in(%w[monthly weekly]))
      end
    end

    context "with goal without due date" do
      let(:goal_without_due_date) do
        create(:goal, family: family, creator: user,
                      title: "Learn to code",
                      time_scale: :annual,
                      due_date: nil)
      end
      let(:service_no_date) { described_class.new(goal_without_due_date) }

      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(valid_ai_response)
      end

      it "returns nil for sub-goal due dates" do
        result = service_no_date.generate

        result[:sub_goals].each do |sub_goal|
          expect(sub_goal[:due_date]).to be_nil
        end
      end
    end

    context "with invalid JSON response" do
      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return("Not valid JSON")
      end

      it "raises GenerationError" do
        expect do
          service.generate
        end.to raise_error(SubGoalGenerationService::GenerationError, /Failed to parse/)
      end
    end

    context "when API client raises error" do
      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_raise(AnthropicClient::RateLimitError, "Rate limited")
      end

      it "raises GenerationError" do
        expect do
          service.generate
        end.to raise_error(SubGoalGenerationService::GenerationError, "Rate limited")
      end
    end

    context "with partial/missing data in response" do
      let(:partial_response) do
        <<~JSON
          {
            "sub_goals": [
              {"title": "Basic sub-goal"}
            ],
            "domain_insights": "Some insights"
          }
        JSON
      end

      before do
        mock_client = instance_double(AnthropicClient)
        allow(AnthropicClient).to receive(:new).and_return(mock_client)
        allow(mock_client).to receive(:chat).and_return(partial_response)
      end

      it "handles missing optional fields gracefully" do
        result = service.generate
        sub_goal = result[:sub_goals].first

        expect(sub_goal[:title]).to eq("Basic sub-goal")
        expect(sub_goal[:description]).to be_nil
        expect(sub_goal[:smart_fields]).to eq({})
      end

      it "assigns default time scale based on parent" do
        result = service.generate
        sub_goal = result[:sub_goals].first

        # Annual parent -> quarterly is first allowed scale
        expect(sub_goal[:time_scale]).to eq("quarterly")
      end

      it "assigns order based on array index when missing" do
        result = service.generate
        sub_goal = result[:sub_goals].first

        expect(sub_goal[:order]).to eq(1)
      end
    end
  end
end
