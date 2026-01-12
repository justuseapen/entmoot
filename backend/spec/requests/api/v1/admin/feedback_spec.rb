# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Admin::Feedback" do
  let(:family) { create(:family) }
  let(:admin_membership) { create(:family_membership, family: family, role: :admin) }
  let(:admin_user) { admin_membership.user }

  let(:adult_membership) { create(:family_membership, family: family, role: :adult) }
  let(:adult_user) { adult_membership.user }

  describe "GET /api/v1/admin/feedback" do
    context "when authenticated as admin" do
      before { create_list(:feedback_report, 3) }

      it "returns list of feedback reports" do
        get "/api/v1/admin/feedback", headers: auth_headers(admin_user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body

        expect(json["feedback_reports"].length).to eq(3)
        expect(json).to have_key("meta")
      end

      it "returns pagination metadata with correct total_count" do
        get "/api/v1/admin/feedback", headers: auth_headers(admin_user)

        json = response.parsed_body
        meta = json["meta"]

        expect(meta).to include(
          "current_page" => 1,
          "total_count" => 3
        )
      end

      it "returns pagination metadata with all required keys" do
        get "/api/v1/admin/feedback", headers: auth_headers(admin_user)

        meta = response.parsed_body["meta"]

        expect(meta.keys).to include("current_page", "total_pages", "total_count", "per_page")
      end

      it "returns feedback report attributes" do
        get "/api/v1/admin/feedback", headers: auth_headers(admin_user)

        report = response.parsed_body["feedback_reports"].first

        expect(report.keys).to include(
          "id", "report_type", "title", "severity", "status", "user", "assigned_to", "created_at"
        )
      end

      context "with pagination" do
        before { create_list(:feedback_report, 25) }

        it "respects per_page parameter" do
          get "/api/v1/admin/feedback",
              params: { per_page: 10 },
              headers: auth_headers(admin_user)

          json = response.parsed_body

          expect(json["feedback_reports"].length).to eq(10)
          expect(json["meta"]["per_page"]).to eq(10)
        end

        it "respects page parameter" do
          get "/api/v1/admin/feedback",
              params: { page: 2, per_page: 10 },
              headers: auth_headers(admin_user)

          json = response.parsed_body

          expect(json["meta"]["current_page"]).to eq(2)
        end

        it "limits per_page to 100" do
          get "/api/v1/admin/feedback",
              params: { per_page: 200 },
              headers: auth_headers(admin_user)

          json = response.parsed_body

          expect(json["meta"]["per_page"]).to eq(100)
        end
      end

      context "when filtering by type" do
        before do
          create(:feedback_report, :bug)
          create(:feedback_report, :feature_request)
        end

        it "returns only bug reports" do
          get "/api/v1/admin/feedback", params: { type: "bug" }, headers: auth_headers(admin_user)

          expect(response.parsed_body["feedback_reports"].pluck("report_type").uniq).to eq(["bug"])
        end
      end

      context "when filtering by status" do
        before do
          create(:feedback_report)
          create(:feedback_report, :acknowledged)
        end

        it "returns only acknowledged reports" do
          get "/api/v1/admin/feedback", params: { status: "acknowledged" }, headers: auth_headers(admin_user)

          expect(response.parsed_body["feedback_reports"].pluck("status").uniq).to eq(["acknowledged"])
        end
      end

      context "when filtering by severity" do
        before do
          create(:feedback_report, :bug, :minor)
          create(:feedback_report, :bug, :blocker)
        end

        it "returns only blocker reports" do
          get "/api/v1/admin/feedback", params: { severity: "blocker" }, headers: auth_headers(admin_user)

          expect(response.parsed_body["feedback_reports"].pluck("severity").uniq).to eq(["blocker"])
        end
      end

      context "when filtering by date range" do
        let!(:old_report) { create(:feedback_report, created_at: 10.days.ago) }
        let!(:recent_report) { create(:feedback_report, created_at: 1.day.ago) }

        it "excludes old reports" do
          get "/api/v1/admin/feedback",
              params: { start_date: 5.days.ago.to_date.to_s },
              headers: auth_headers(admin_user)

          ids = response.parsed_body["feedback_reports"].pluck("id")

          expect(ids).to include(recent_report.id)
          expect(ids).not_to include(old_report.id)
        end
      end
    end

    context "when authenticated as non-admin" do
      it "returns forbidden status" do
        get "/api/v1/admin/feedback", headers: auth_headers(adult_user)

        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body["error"]).to eq("Admin access required")
      end
    end

    context "when not authenticated" do
      it "returns unauthorized status" do
        get "/api/v1/admin/feedback"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/admin/feedback/:id" do
    let(:feedback_report) { create(:feedback_report, :bug, :with_contact) }

    context "when authenticated as admin" do
      it "returns feedback report details" do
        get "/api/v1/admin/feedback/#{feedback_report.id}", headers: auth_headers(admin_user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body["feedback_report"]

        expect(json["id"]).to eq(feedback_report.id)
        expect(json["title"]).to eq(feedback_report.title)
        expect(json["description"]).to eq(feedback_report.description)
      end

      it "returns detailed attributes" do
        get "/api/v1/admin/feedback/#{feedback_report.id}", headers: auth_headers(admin_user)

        json = response.parsed_body["feedback_report"]

        expect(json.keys).to include(
          "description", "context_data", "allow_contact", "contact_email",
          "has_screenshot", "resolved_at", "duplicates_count"
        )
      end

      it "returns user information" do
        get "/api/v1/admin/feedback/#{feedback_report.id}", headers: auth_headers(admin_user)

        json = response.parsed_body["feedback_report"]

        expect(json["user"]).to have_key("id")
        expect(json["user"]).to have_key("name")
        expect(json["user"]).to have_key("email")
      end

      context "with assigned user" do
        let(:assigned_user) { create(:user) }

        before { feedback_report.update!(assigned_to: assigned_user) }

        it "returns assigned_to information" do
          get "/api/v1/admin/feedback/#{feedback_report.id}", headers: auth_headers(admin_user)

          json = response.parsed_body["feedback_report"]

          expect(json["assigned_to"]["id"]).to eq(assigned_user.id)
          expect(json["assigned_to"]["name"]).to eq(assigned_user.name)
        end
      end

      context "when marked as duplicate" do
        let(:original_report) { create(:feedback_report, title: "Original Report") }

        before { feedback_report.mark_as_duplicate!(original_report.id) }

        it "returns duplicate_of information" do
          get "/api/v1/admin/feedback/#{feedback_report.id}", headers: auth_headers(admin_user)

          json = response.parsed_body["feedback_report"]

          expect(json["duplicate_of"]["id"]).to eq(original_report.id)
          expect(json["duplicate_of"]["title"]).to eq("Original Report")
        end
      end
    end

    context "when authenticated as non-admin" do
      it "returns forbidden status" do
        get "/api/v1/admin/feedback/#{feedback_report.id}", headers: auth_headers(adult_user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when feedback report not found" do
      it "returns not found status" do
        get "/api/v1/admin/feedback/999999", headers: auth_headers(admin_user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "PATCH /api/v1/admin/feedback/:id" do
    let(:feedback_report) { create(:feedback_report, :bug) }

    context "when authenticated as admin" do
      it "updates status" do
        patch "/api/v1/admin/feedback/#{feedback_report.id}",
              params: { feedback_report: { status: "acknowledged" } },
              headers: auth_headers(admin_user)

        expect(response).to have_http_status(:ok)
        expect(feedback_report.reload.status).to eq("acknowledged")
      end

      it "assigns to user" do
        assignee = create(:user)

        patch "/api/v1/admin/feedback/#{feedback_report.id}",
              params: { feedback_report: { assigned_to_id: assignee.id } },
              headers: auth_headers(admin_user)

        expect(response).to have_http_status(:ok)
        expect(feedback_report.reload.assigned_to).to eq(assignee)
      end

      it "adds internal notes" do
        patch "/api/v1/admin/feedback/#{feedback_report.id}",
              params: { feedback_report: { internal_notes: "Looking into this issue" } },
              headers: auth_headers(admin_user)

        expect(response).to have_http_status(:ok)
        expect(feedback_report.reload.internal_notes).to eq("Looking into this issue")
      end

      it "marks as duplicate" do
        original = create(:feedback_report)

        patch "/api/v1/admin/feedback/#{feedback_report.id}",
              params: { feedback_report: { duplicate_of_id: original.id } },
              headers: auth_headers(admin_user)

        expect(response).to have_http_status(:ok)
        expect(feedback_report.reload.duplicate_of_id).to eq(original.id)
      end

      it "returns updated feedback report" do
        patch "/api/v1/admin/feedback/#{feedback_report.id}",
              params: { feedback_report: { status: "in_progress", internal_notes: "Working on fix" } },
              headers: auth_headers(admin_user)

        json = response.parsed_body["feedback_report"]

        expect(json["status"]).to eq("in_progress")
        expect(json["internal_notes"]).to eq("Working on fix")
      end

      it "supports status workflow from new to closed" do
        %w[acknowledged in_progress resolved closed].each do |status|
          patch "/api/v1/admin/feedback/#{feedback_report.id}",
                params: { feedback_report: { status: status } },
                headers: auth_headers(admin_user)
          expect(response).to have_http_status(:ok)
        end

        expect(feedback_report.reload.status).to eq("closed")
      end

      context "with invalid status" do
        it "returns error" do
          patch "/api/v1/admin/feedback/#{feedback_report.id}",
                params: { feedback_report: { status: "invalid_status" } },
                headers: auth_headers(admin_user)

          expect(response).to have_http_status(:unprocessable_content)
        end
      end
    end

    context "when authenticated as non-admin" do
      it "returns forbidden status" do
        patch "/api/v1/admin/feedback/#{feedback_report.id}",
              params: { feedback_report: { status: "acknowledged" } },
              headers: auth_headers(adult_user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
