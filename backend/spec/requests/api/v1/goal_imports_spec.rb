# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Goal Imports API" do
  let(:family) { create(:family) }
  let(:user) { create(:user, name: "Daniel Smith") }
  let(:membership) { create(:family_membership, family: family, user: user, role: :admin) }
  let(:mock_client) { instance_double(AnthropicClient) }
  let(:csv_content) do
    <<~CSV
      ,Title,Specific,Measurable,Achievable,Relevant,Time-bound
      Meta,,,,,,,
      ,Daily Checkin,Checkin on top 3 items daily,Count checklists weekly,Yes,Yes,Daily by EOD
    CSV
  end
  let(:llm_response) do
    {
      "title" => "Daily Check-in",
      "description" => nil,
      "time_scale" => "daily",
      "specific" => "Check in on top 3 items daily",
      "measurable" => "Count checklists weekly",
      "achievable" => "Yes",
      "relevant" => "Yes",
      "time_bound" => "Daily by end of day",
      "assignee_names" => [],
      "confidence" => 0.95
    }.to_json
  end

  before do
    membership
    allow(AnthropicClient).to receive(:new).and_return(mock_client)
    allow(mock_client).to receive(:chat).and_return(llm_response)
  end

  describe "POST /api/v1/families/:family_id/goal_import" do
    context "with valid CSV content as parameter" do
      it "imports goals and returns results" do
        post "/api/v1/families/#{family.id}/goal_import",
             params: { csv_content: csv_content },
             headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["status"]).to eq("completed")
        expect(json["results"]["created_count"]).to be >= 1
        expect(json["results"]["categories"]).to include("Meta")
      end
    end

    context "with CSV file upload" do
      it "imports goals from uploaded file" do
        file = Rack::Test::UploadedFile.new(
          StringIO.new(csv_content),
          "text/csv",
          original_filename: "goals.csv"
        )

        post "/api/v1/families/#{family.id}/goal_import",
             params: { file: file },
             headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["status"]).to eq("completed")
      end
    end

    context "with generate_sub_goals option" do
      # rubocop:disable RSpec/ExampleLength
      it "includes sub-goal suggestions in response" do
        annual_csv = <<~CSV
          ,Title,Specific,Measurable,Achievable,Relevant,Time-bound
          ,Ultramarathon,Complete a 50K,Race completion,Yes,Yes,EOY
        CSV

        annual_goal_response = {
          "title" => "Ultramarathon", "time_scale" => "annual", "specific" => "Complete a 50K ultra marathon",
          "measurable" => "Race completion", "achievable" => "Yes", "relevant" => "Yes",
          "time_bound" => "End of year", "assignee_names" => [], "confidence" => 0.95
        }.to_json

        sub_goal_response = {
          "milestones" => [{ "title" => "Milestone 1", "time_scale" => "quarterly", "due_offset_days" => 90 }],
          "weekly_tasks" => [{ "title" => "Weekly task", "description" => "Do this weekly", "frequency" => "weekly" }]
        }.to_json

        call_count = 0
        allow(mock_client).to receive(:chat) { (call_count += 1) == 1 ? annual_goal_response : sub_goal_response }

        post "/api/v1/families/#{family.id}/goal_import",
             params: { csv_content: annual_csv, generate_sub_goals: true },
             headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        expect(response.parsed_body["results"]["sub_goal_suggestions"]).not_to be_empty
      end
      # rubocop:enable RSpec/ExampleLength
    end

    context "without CSV content" do
      it "returns bad request" do
        post "/api/v1/families/#{family.id}/goal_import",
             params: {},
             headers: auth_headers(user)

        expect(response).to have_http_status(:bad_request)
        expect(response.parsed_body["error"]).to eq("No CSV file provided")
      end
    end

    context "with malformed CSV" do
      it "returns unprocessable content" do
        post "/api/v1/families/#{family.id}/goal_import",
             params: { csv_content: "invalid,\"csv content" },
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["error"]).to include("Invalid CSV format")
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/families/#{family.id}/goal_import",
             params: { csv_content: csv_content }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when not a family member" do
      let(:other_user) { create(:user) }

      it "returns forbidden" do
        post "/api/v1/families/#{family.id}/goal_import",
             params: { csv_content: csv_content },
             headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "with large file (async processing)" do
      let(:large_csv) { "x" * 150.kilobytes }

      before { allow(GoalImportJob).to receive(:perform_later) }

      it "queues the job and returns processing status" do
        post "/api/v1/families/#{family.id}/goal_import",
             params: { csv_content: large_csv },
             headers: auth_headers(user)

        expect(response).to have_http_status(:accepted)
        json = response.parsed_body
        expect(json["status"]).to eq("processing")
        expect(json["job_id"]).to be_present
        expect(GoalImportJob).to have_received(:perform_later)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/goal_import/status" do
    context "when job is still processing" do
      it "returns processing status" do
        get "/api/v1/families/#{family.id}/goal_import/status",
            params: { job_id: "test-job-id" },
            headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["status"]).to eq("processing")
      end
    end

    context "when job is completed" do
      let(:completed_result) do
        { created_count: 5, failed_count: 1, categories: ["Meta"], goals: [], failures: [] }
      end

      before { allow(Rails.cache).to receive(:read).with("goal_import:completed-job").and_return(completed_result) }

      it "returns completed status with results" do
        get "/api/v1/families/#{family.id}/goal_import/status",
            params: { job_id: "completed-job" },
            headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["status"]).to eq("completed")
        expect(json["results"]["created_count"]).to eq(5)
      end
    end

    context "when job failed" do
      before do
        allow(Rails.cache).to receive(:read)
          .with("goal_import:failed-job")
          .and_return({ error: "Something went wrong" })
      end

      it "returns failed status with error" do
        get "/api/v1/families/#{family.id}/goal_import/status",
            params: { job_id: "failed-job" },
            headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["status"]).to eq("failed")
        expect(json["error"]).to eq("Something went wrong")
      end
    end

    context "without job_id" do
      it "returns bad request" do
        get "/api/v1/families/#{family.id}/goal_import/status",
            headers: auth_headers(user)

        expect(response).to have_http_status(:bad_request)
      end
    end
  end
end
