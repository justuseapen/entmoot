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

  describe "GET /api/v1/feedback/eligibility" do
    context "when user is authenticated" do
      let(:user) { create(:user, created_at: 60.days.ago) }
      let(:family) { create(:family) }

      before do
        create(:family_membership, user: user, family: family, role: "admin")
      end

      it "returns NPS eligibility status" do
        get "/api/v1/feedback/eligibility", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json).to have_key("nps_eligible")
        expect(json).to have_key("days_until_nps_eligible")
        expect(json).to have_key("last_nps_date")
      end

      context "when user is new (less than 30 days)" do
        let(:new_user) { create(:user, created_at: 10.days.ago) }

        before do
          create(:family_membership, user: new_user, family: family, role: "adult")
        end

        it "returns not eligible with days until eligible" do
          get "/api/v1/feedback/eligibility", headers: auth_headers(new_user)

          json = response.parsed_body
          expect(json["nps_eligible"]).to be(false)
          expect(json["days_until_nps_eligible"]).to eq(20)
        end
      end

      context "when user has meaningful activity and is eligible" do
        before do
          create(:daily_plan, family: family, user: user)
        end

        it "returns eligible for NPS" do
          get "/api/v1/feedback/eligibility", headers: auth_headers(user)

          json = response.parsed_body
          expect(json["nps_eligible"]).to be(true)
          expect(json["days_until_nps_eligible"]).to eq(0)
        end
      end

      context "when user was recently prompted for NPS" do
        before do
          create(:daily_plan, family: family, user: user)
          user.update(last_nps_prompt_date: 30.days.ago)
        end

        it "returns not eligible until quarterly period passes" do
          get "/api/v1/feedback/eligibility", headers: auth_headers(user)

          json = response.parsed_body
          expect(json["nps_eligible"]).to be(false)
          expect(json["days_until_nps_eligible"]).to eq(60)
        end
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/feedback/eligibility"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/feedback/dismiss_nps" do
    let(:user) { create(:user, created_at: 60.days.ago) }

    context "when user is authenticated" do
      it "records NPS dismissal and returns success" do
        expect do
          post "/api/v1/feedback/dismiss_nps", headers: auth_headers(user)
        end.to change { user.reload.last_nps_prompt_date }.from(nil)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["success"]).to be(true)
        expect(json["next_eligible_date"]).to be_present
      end

      it "sets next eligible date to 90 days from now" do
        post "/api/v1/feedback/dismiss_nps", headers: auth_headers(user)

        json = response.parsed_body
        next_date = Time.zone.parse(json["next_eligible_date"])
        expect(next_date).to be_within(1.day).of(90.days.from_now)
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/feedback/dismiss_nps"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/feedback/nps_follow_up" do
    let(:user) { create(:user) }

    context "when user is authenticated" do
      it "returns promoter follow-up question for score 9" do
        get "/api/v1/feedback/nps_follow_up", params: { score: 9 }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["question"]).to eq("What do you love most about Entmoot?")
        expect(json["category"]).to eq("promoter")
      end

      it "returns promoter follow-up question for score 10" do
        get "/api/v1/feedback/nps_follow_up", params: { score: 10 }, headers: auth_headers(user)

        json = response.parsed_body
        expect(json["category"]).to eq("promoter")
      end

      it "returns passive follow-up question for score 7-8" do
        get "/api/v1/feedback/nps_follow_up", params: { score: 7 }, headers: auth_headers(user)

        json = response.parsed_body
        expect(json["question"]).to eq("What could we improve to make Entmoot even better?")
        expect(json["category"]).to eq("passive")
      end

      it "returns detractor follow-up question for score 0-6" do
        get "/api/v1/feedback/nps_follow_up", params: { score: 5 }, headers: auth_headers(user)

        json = response.parsed_body
        expect(json["question"]).to include("sorry to hear")
        expect(json["category"]).to eq("detractor")
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/feedback/nps_follow_up", params: { score: 9 }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "NPS feedback recording" do
    let(:user) { create(:user, created_at: 60.days.ago) }
    let(:family) { create(:family) }

    before do
      create(:family_membership, user: user, family: family, role: "admin")
    end

    context "when submitting NPS feedback" do
      let(:nps_params) do
        {
          report_type: "nps",
          title: "NPS Survey Response",
          context_data: { score: 9, follow_up: "Love it!" }
        }
      end

      it "records the NPS prompt date" do
        expect do
          post "/api/v1/feedback", params: nps_params, headers: auth_headers(user)
        end.to change { user.reload.last_nps_prompt_date }.from(nil)
      end
    end

    context "when submitting quick feedback with feature" do
      let(:quick_feedback_params) do
        {
          report_type: "quick_feedback",
          title: "Feature Feedback",
          context_data: { feature: "goal_refinement", rating: "positive" }
        }
      end

      it "records the feature feedback in first_actions" do
        post "/api/v1/feedback", params: quick_feedback_params, headers: auth_headers(user)

        expect(user.reload.first_actions).to have_key("feature_feedback_goal_refinement")
      end
    end
  end
end
