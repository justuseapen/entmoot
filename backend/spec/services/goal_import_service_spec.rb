# frozen_string_literal: true

require "rails_helper"

RSpec.describe GoalImportService do
  let(:family) { create(:family) }
  let(:user) { create(:user, name: "Daniel Smith") }
  let(:membership) { create(:family_membership, family: family, user: user, role: :admin) }
  let(:mock_client) { instance_double(AnthropicClient) }
  let(:service) { described_class.new(family: family, user: user, client: mock_client) }

  before { membership }

  describe "#import" do
    context "with valid CSV content" do
      let(:csv_content) do
        <<~CSV
          ,Title,Specific,Measurable,Achievable,Relevant,Time-bound
          Meta,,,,,,,
          ,Daily Checkin,Checkin on top 3 items daily,Count checklists weekly,Yes,Yes,Daily by EOD
          ,Weekly Planning,Review daily checklists and plan for next week,Count logs monthly,Yes,Yes,Weekly Thursday Evening
          Spiritual,,,,,,,
          ,Consistent daily prayer,Daniel to lead family prayer,Checklist,Yes,Yes,2x Daily
        CSV
      end

      let(:llm_response) do
        {
          "title" => "Daily Check-in",
          "description" => nil,
          "time_scale" => "daily",
          "specific" => "Check in on top 3 items daily",
          "measurable" => "Count checklists weekly",
          "achievable" => "Yes - this is a simple daily habit",
          "relevant" => "Important for tracking progress",
          "time_bound" => "Daily by end of day",
          "assignee_names" => [],
          "confidence" => 0.95
        }.to_json
      end

      before do
        allow(mock_client).to receive(:chat).and_return(llm_response)
      end

      it "parses categories correctly" do
        results = service.import(csv_content: csv_content)

        expect(results[:categories]).to contain_exactly("Meta", "Spiritual")
      end

      it "creates goals from goal rows" do
        results = service.import(csv_content: csv_content)

        expect(results[:created_count]).to be >= 1
        expect(results[:goals]).not_to be_empty
      end

      it "returns goal details in the results" do
        results = service.import(csv_content: csv_content)

        expect(results[:goals].first).to include(
          :id, :title, :time_scale, :category, :assignees
        )
      end

      it "sets the creator to the importing user" do
        service.import(csv_content: csv_content)

        created_goal = Goal.last
        expect(created_goal.creator).to eq(user)
      end

      it "sets the family correctly" do
        service.import(csv_content: csv_content)

        created_goal = Goal.last
        expect(created_goal.family).to eq(family)
      end
    end

    context "with assignee names in the goal" do
      # rubocop:disable RSpec/ExampleLength
      it "matches and assigns family members by first name" do
        kathryn = create(:user, name: "Kathryn Smith")
        create(:family_membership, family: family, user: kathryn, role: :adult)

        csv_content = <<~CSV
          ,Title,Specific,Measurable,Achievable,Relevant,Time-bound
          ,Daily prayer,Daniel to lead prayer,Checklist,Yes,Yes,Daily
        CSV

        llm_response_with_assignee = {
          "title" => "Daily prayer",
          "time_scale" => "daily",
          "specific" => "Daniel to lead family prayer",
          "measurable" => "Checklist",
          "achievable" => "Yes",
          "relevant" => "Yes",
          "time_bound" => "Daily",
          "assignee_names" => ["Daniel"],
          "confidence" => 0.9
        }.to_json

        allow(mock_client).to receive(:chat).and_return(llm_response_with_assignee)

        service.import(csv_content: csv_content)

        created_goal = Goal.last
        expect(created_goal.assignees).to include(user)
      end
      # rubocop:enable RSpec/ExampleLength
    end

    context "with sub-goal generation enabled" do
      # rubocop:disable RSpec/ExampleLength
      it "generates sub-goal suggestions for annual goals" do
        csv_content = <<~CSV
          ,Title,Specific,Measurable,Achievable,Relevant,Time-bound
          ,Ultramarathon,Complete a 50K ultra marathon,Race completion,Yes,Self Mastery,EOY
        CSV

        goal_response = {
          "title" => "Ultramarathon",
          "time_scale" => "annual",
          "specific" => "Complete a 50K ultra marathon",
          "measurable" => "Race completion",
          "achievable" => "Yes",
          "relevant" => "Self Mastery",
          "time_bound" => "End of year",
          "assignee_names" => [],
          "confidence" => 0.95
        }.to_json

        sub_goal_response = {
          "milestones" => [
            { "title" => "Build base endurance", "time_scale" => "quarterly", "due_offset_days" => 90 }
          ],
          "weekly_tasks" => [
            { "title" => "3 runs per week", "description" => "Minimum 3 running sessions", "frequency" => "weekly" }
          ]
        }.to_json

        call_count = 0
        allow(mock_client).to receive(:chat) do
          call_count += 1
          call_count == 1 ? goal_response : sub_goal_response
        end

        results = service.import(csv_content: csv_content, generate_sub_goals: true)

        expect(results[:sub_goal_suggestions]).not_to be_empty
        suggestion = results[:sub_goal_suggestions].first
        expect(suggestion[:milestones]).not_to be_empty
        expect(suggestion[:weekly_tasks]).not_to be_empty
      end
      # rubocop:enable RSpec/ExampleLength
    end

    context "with malformed CSV" do
      let(:csv_content) { "this is not,\"valid csv" }

      it "raises an ImportError" do
        expect { service.import(csv_content: csv_content) }
          .to raise_error(described_class::ImportError, /Invalid CSV format/)
      end
    end

    context "with empty CSV" do
      let(:csv_content) { "" }

      it "returns zero counts" do
        results = service.import(csv_content: csv_content)

        expect(results[:created_count]).to eq(0)
        expect(results[:failed_count]).to eq(0)
      end
    end

    context "when LLM parsing fails" do
      let(:csv_content) do
        <<~CSV
          ,Title,Specific,Measurable,Achievable,Relevant,Time-bound
          ,Test Goal,Test specific,Test measurable,Yes,Yes,Daily
        CSV
      end

      before do
        allow(mock_client).to receive(:chat)
          .and_raise(AnthropicClient::ApiError.new("API error"))
      end

      it "records the failure" do
        results = service.import(csv_content: csv_content)

        expect(results[:failed_count]).to eq(1)
        expect(results[:failures].first[:error]).to include("AI parsing failed")
      end
    end
  end

  describe "row type detection" do
    it "detects header rows correctly" do
      row = ["", "Title", "Specific", "Measurable", "Achievable", "Relevant", "Time-bound"]
      expect(service.send(:detect_row_type, row)).to eq(:header)
    end

    it "detects category rows correctly" do
      row = ["Meta", nil, nil, nil, nil, nil, nil]
      expect(service.send(:detect_row_type, row)).to eq(:category)
    end

    it "detects goal rows correctly" do
      row = [nil, "My Goal", "Specific text", "Measurable", nil, nil, nil]
      expect(service.send(:detect_row_type, row)).to eq(:goal)
    end

    it "detects empty rows correctly" do
      row = [nil, nil, nil, nil, nil, nil, nil]
      expect(service.send(:detect_row_type, row)).to eq(:empty)
    end
  end

  describe "assignee matching" do
    it "matches by exact first name (case insensitive)" do
      # Reload family members
      service.instance_variable_set(:@family_members, service.send(:load_family_members))

      result = service.send(:match_assignee, "DANIEL")
      expect(result).to eq(user.id)
    end

    it "matches by first name" do
      kathryn = create(:user, name: "Kathryn Jones")
      create(:family_membership, family: family, user: kathryn, role: :adult)

      # Reload family members after adding kathryn
      service.instance_variable_set(:@family_members, service.send(:load_family_members))

      result = service.send(:match_assignee, "Kathryn")
      expect(result).to eq(kathryn.id)
    end

    it "returns nil for unmatched names" do
      # Reload family members
      service.instance_variable_set(:@family_members, service.send(:load_family_members))

      result = service.send(:match_assignee, "UnknownPerson")
      expect(result).to be_nil
    end
  end

  describe "time scale normalization" do
    it "normalizes valid time scales" do
      expect(service.send(:normalize_time_scale, "daily")).to eq("daily")
      expect(service.send(:normalize_time_scale, "WEEKLY")).to eq("weekly")
      expect(service.send(:normalize_time_scale, "Monthly")).to eq("monthly")
    end

    it "defaults to annual for invalid time scales" do
      expect(service.send(:normalize_time_scale, "invalid")).to eq("annual")
      expect(service.send(:normalize_time_scale, nil)).to eq("annual")
    end
  end
end
