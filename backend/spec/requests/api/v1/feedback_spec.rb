# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Feedback" do
  include AuthHelpers

  describe "POST /api/v1/feedback" do
    let(:valid_params) do
      {
        report_type: "bug",
        title: "Button not working",
        description: "When I click the submit button, nothing happens",
        severity: "major",
        allow_contact: true,
        contact_email: "user@example.com",
        context_data: {
          url: "/goals",
          browser: "Chrome 120",
          os: "macOS 14",
          screen_resolution: "1920x1080",
          app_version: "1.0.0"
        }
      }
    end

    context "when user is authenticated" do
      let(:user) { create(:user) }

      it "creates a feedback report associated with the user" do
        post "/api/v1/feedback", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["feedback_report"]["id"]).to be_present
        expect(json["feedback_report"]["report_type"]).to eq("bug")
        expect(json["feedback_report"]["title"]).to eq("Button not working")
        expect(json["feedback_report"]["status"]).to eq("new")
      end

      it "associates the report with the current user" do
        expect do
          post "/api/v1/feedback", params: valid_params, headers: auth_headers(user)
        end.to change { user.feedback_reports.count }.by(1)
      end

      it "stores context data" do
        post "/api/v1/feedback", params: valid_params, headers: auth_headers(user)

        json = response.parsed_body
        expect(json["feedback_report"]["context_data"]["url"]).to eq("/goals")
        expect(json["feedback_report"]["context_data"]["browser"]).to eq("Chrome 120")
      end
    end

    context "when user is not authenticated" do
      it "creates an anonymous feedback report" do
        post "/api/v1/feedback", params: valid_params

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["feedback_report"]["id"]).to be_present

        report = FeedbackReport.last
        expect(report.user).to be_nil
      end
    end

    context "with feature request type" do
      let(:feature_params) do
        {
          report_type: "feature_request",
          title: "Add dark mode",
          description: "Would love a dark mode option"
        }
      end

      it "creates a feature request without severity" do
        post "/api/v1/feedback", params: feature_params

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["feedback_report"]["report_type"]).to eq("feature_request")
        expect(json["feedback_report"]["severity"]).to be_nil
      end
    end

    context "with general feedback type" do
      let(:feedback_params) do
        {
          report_type: "feedback",
          title: "Great app!",
          description: "Really enjoying using Entmoot"
        }
      end

      it "creates general feedback" do
        post "/api/v1/feedback", params: feedback_params

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["feedback_report"]["report_type"]).to eq("feedback")
      end
    end

    context "with invalid params" do
      it "returns errors when title is missing" do
        post "/api/v1/feedback", params: valid_params.except(:title)

        expect(response).to have_http_status(:unprocessable_content)
        json = response.parsed_body
        expect(json["errors"]).to include("Title can't be blank")
      end

      it "returns errors when bug has no description" do
        params = valid_params.except(:description)
        post "/api/v1/feedback", params: params

        expect(response).to have_http_status(:unprocessable_content)
        json = response.parsed_body
        expect(json["errors"]).to include("Description can't be blank")
      end

      it "returns errors for invalid email format" do
        params = valid_params.merge(contact_email: "not-an-email")
        post "/api/v1/feedback", params: params

        expect(response).to have_http_status(:unprocessable_content)
        json = response.parsed_body
        expect(json["errors"]).to include("Contact email is invalid")
      end
    end

    context "with NPS feedback" do
      let(:nps_params) do
        {
          report_type: "nps",
          title: "NPS Survey Response",
          context_data: {
            score: 9,
            follow_up: "Great product!"
          }
        }
      end

      it "creates NPS feedback" do
        post "/api/v1/feedback", params: nps_params

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["feedback_report"]["report_type"]).to eq("nps")
        expect(json["feedback_report"]["context_data"]["score"]).to eq("9")
      end
    end

    context "with quick feedback" do
      let(:quick_feedback_params) do
        {
          report_type: "quick_feedback",
          title: "Weekly Review Feedback",
          context_data: {
            feature: "weekly_review",
            rating: "positive"
          }
        }
      end

      it "creates quick feedback" do
        post "/api/v1/feedback", params: quick_feedback_params

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["feedback_report"]["report_type"]).to eq("quick_feedback")
      end
    end
  end

  describe "GET /api/v1/feedback/:id" do
    let(:user) { create(:user) }

    context "when viewing own feedback report" do
      let!(:report) { create(:feedback_report, user: user) }

      it "returns the feedback report" do
        get "/api/v1/feedback/#{report.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["feedback_report"]["id"]).to eq(report.id)
        expect(json["feedback_report"]["title"]).to eq(report.title)
        expect(json["feedback_report"]["status"]).to eq(report.status)
      end

      it "includes has_screenshot flag" do
        get "/api/v1/feedback/#{report.id}", headers: auth_headers(user)

        json = response.parsed_body
        expect(json["feedback_report"]["has_screenshot"]).to be(false)
      end
    end

    context "when viewing another user's feedback report" do
      let(:other_user) { create(:user) }
      let!(:report) { create(:feedback_report, user: other_user) }

      it "returns not found" do
        get "/api/v1/feedback/#{report.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end

    context "when not authenticated" do
      let!(:report) { create(:feedback_report, user: user) }

      it "returns unauthorized" do
        get "/api/v1/feedback/#{report.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
