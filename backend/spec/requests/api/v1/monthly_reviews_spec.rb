# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::MonthlyReviews" do
  let(:user) { create(:user) }
  let(:family) { create(:family, timezone: "America/New_York") }

  before { create(:family_membership, :adult, family: family, user: user) }

  describe "GET /api/v1/families/:family_id/monthly_reviews" do
    context "when user is authenticated and a family member" do
      it "returns the user's monthly reviews" do
        review1 = create(:monthly_review, user: user, family: family, month: Date.current.beginning_of_month)
        review2 = create(:monthly_review, :last_month, user: user, family: family)

        get "/api/v1/families/#{family.id}/monthly_reviews", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["monthly_reviews"].length).to eq(2)
        expect(json_response["monthly_reviews"].pluck("id")).to contain_exactly(review1.id, review2.id)
      end

      it "returns reviews ordered by month descending" do
        create(:monthly_review, :two_months_ago, user: user, family: family)
        create(:monthly_review, :last_month, user: user, family: family)
        create(:monthly_review, user: user, family: family, month: Date.current.beginning_of_month)

        get "/api/v1/families/#{family.id}/monthly_reviews", headers: auth_headers(user)

        dates = json_response["monthly_reviews"].pluck("month")
        expect(dates).to eq(dates.sort.reverse)
      end

      it "does not include other users' reviews" do
        other_user = create(:user)
        create(:family_membership, :adult, family: family, user: other_user)
        create(:monthly_review, user: other_user, family: family)
        month = Date.current.beginning_of_month
        user_review = create(:monthly_review, user: user, family: family, month: month)

        get "/api/v1/families/#{family.id}/monthly_reviews", headers: auth_headers(user)

        expect(json_response["monthly_reviews"].length).to eq(1)
        expect(json_response["monthly_reviews"].first["id"]).to eq(user_review.id)
      end

      it "does not include metrics in list view" do
        create(:monthly_review, user: user, family: family)

        get "/api/v1/families/#{family.id}/monthly_reviews", headers: auth_headers(user)

        expect(json_response["monthly_reviews"].first).not_to have_key("metrics")
      end

      it "filters by mentioned_by" do
        mentioned_user = create(:user)
        create(:family_membership, :adult, family: family, user: mentioned_user)

        mentioned_review = create(:monthly_review, user: user, family: family, month: Date.current.beginning_of_month)
        create(:mention, user: user, mentioned_user: mentioned_user, mentionable: mentioned_review, text_field: "lessons_learned")
        create(:monthly_review, :last_month, user: user, family: family)

        get "/api/v1/families/#{family.id}/monthly_reviews",
            params: { mentioned_by: mentioned_user.id },
            headers: auth_headers(user)

        expect(json_response["monthly_reviews"].length).to eq(1)
        expect(json_response["monthly_reviews"].first["id"]).to eq(mentioned_review.id)
      end

      it "returns empty array when no mentions match" do
        create(:monthly_review, user: user, family: family)

        get "/api/v1/families/#{family.id}/monthly_reviews",
            params: { mentioned_by: user.id },
            headers: auth_headers(user)

        expect(json_response["monthly_reviews"]).to eq([])
      end
    end

    context "when user is not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        get "/api/v1/families/#{other_family.id}/monthly_reviews", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/families/#{family.id}/monthly_reviews"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/monthly_reviews/current" do
    context "when user is authenticated and a family member" do
      it "creates a new monthly review if none exists" do
        expect do
          get "/api/v1/families/#{family.id}/monthly_reviews/current", headers: auth_headers(user)
        end.to change(MonthlyReview, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(json_response["user_id"]).to eq(user.id)
        expect(json_response["family_id"]).to eq(family.id)
      end

      it "returns existing review if one exists for this month" do
        timezone = Time.find_zone("America/New_York")
        month_start = timezone.today.beginning_of_month
        existing_review = create(:monthly_review, user: user, family: family, month: month_start)

        expect do
          get "/api/v1/families/#{family.id}/monthly_reviews/current", headers: auth_headers(user)
        end.not_to change(MonthlyReview, :count)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(existing_review.id)
      end

      it "includes metrics in response" do
        get "/api/v1/families/#{family.id}/monthly_reviews/current", headers: auth_headers(user)

        expect(json_response).to have_key("metrics")
        expect(json_response["metrics"]).to have_key("task_completion")
        expect(json_response["metrics"]).to have_key("goal_progress")
        expect(json_response["metrics"]).to have_key("reflection_consistency")
      end

      it "includes all review fields" do
        get "/api/v1/families/#{family.id}/monthly_reviews/current", headers: auth_headers(user)

        expect(json_response).to include(
          "id", "month", "user_id", "family_id",
          "highlights", "challenges", "next_month_focus",
          "lessons_learned", "completed"
        )
      end
    end

    context "when user is not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        get "/api/v1/families/#{other_family.id}/monthly_reviews/current", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/monthly_reviews/:id" do
    let(:monthly_review) { create(:monthly_review, :with_content, user: user, family: family) }

    context "when viewing own review" do
      it "returns the monthly review" do
        get "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(monthly_review.id)
      end

      it "includes all fields" do
        get "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}", headers: auth_headers(user)

        expect(json_response["highlights"]).to eq(monthly_review.highlights)
        expect(json_response["challenges"]).to eq(monthly_review.challenges)
        expect(json_response["next_month_focus"]).to eq(monthly_review.next_month_focus)
        expect(json_response["lessons_learned"]).to eq(monthly_review.lessons_learned)
      end

      it "includes metrics" do
        get "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}", headers: auth_headers(user)

        expect(json_response).to have_key("metrics")
      end
    end

    context "when viewing another family member's review" do
      let(:other_member) { create(:user) }
      let(:other_review) { create(:monthly_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns the monthly review" do
        get "/api/v1/families/#{family.id}/monthly_reviews/#{other_review.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(other_review.id)
      end
    end

    context "when review does not exist" do
      it "returns not found" do
        get "/api/v1/families/#{family.id}/monthly_reviews/999999", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "PATCH /api/v1/families/:family_id/monthly_reviews/:id" do
    let(:monthly_review) { create(:monthly_review, user: user, family: family) }

    context "when updating own review" do
      it "updates highlights" do
        patch "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}",
              params: { monthly_review: { highlights: ["Completed Q1 goals", "Team collaboration"] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Monthly review updated successfully.")
        expect(json_response["monthly_review"]["highlights"]).to eq(["Completed Q1 goals", "Team collaboration"])
      end

      it "updates challenges" do
        patch "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}",
              params: { monthly_review: { challenges: ["Resource constraints", "Technical debt"] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["monthly_review"]["challenges"]).to eq(["Resource constraints", "Technical debt"])
      end

      it "updates next_month_focus" do
        patch "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}",
              params: { monthly_review: { next_month_focus: ["Launch feature", "Team building", "Documentation"] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["monthly_review"]["next_month_focus"]).to eq(
          ["Launch feature", "Team building", "Documentation"]
        )
      end

      it "updates lessons_learned" do
        patch "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}",
              params: { monthly_review: { lessons_learned: "Planning ahead pays off" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["monthly_review"]["lessons_learned"]).to eq("Planning ahead pays off")
      end

      it "updates completed status" do
        patch "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}",
              params: { monthly_review: { completed: true } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["monthly_review"]["completed"]).to be(true)
      end

      it "updates multiple fields at once" do
        params = { highlights: ["Highlight"], challenges: ["Issue"], completed: true }
        patch "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}",
              params: { monthly_review: params }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["monthly_review"]).to include(
          "highlights" => ["Highlight"], "challenges" => ["Issue"], "completed" => true
        )
      end
    end

    context "when trying to update another user's review" do
      let(:other_member) { create(:user) }
      let(:other_review) { create(:monthly_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns forbidden" do
        patch "/api/v1/families/#{family.id}/monthly_reviews/#{other_review.id}",
              params: { monthly_review: { lessons_learned: "Hacked!" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/families/:family_id/monthly_reviews/:id" do
    context "when deleting own review" do
      let!(:monthly_review) { create(:monthly_review, user: user, family: family) }

      it "deletes the review" do
        expect do
          delete "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}", headers: auth_headers(user)
        end.to change(MonthlyReview, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Monthly review deleted successfully.")
      end
    end

    context "when trying to delete another user's review" do
      let(:other_member) { create(:user) }
      let!(:other_review) { create(:monthly_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns forbidden" do
        expect do
          delete "/api/v1/families/#{family.id}/monthly_reviews/#{other_review.id}", headers: auth_headers(user)
        end.not_to change(MonthlyReview, :count)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/monthly_reviews/:id/metrics" do
    let(:monthly_review) { create(:monthly_review, user: user, family: family) }

    context "when viewing own review metrics" do
      it "returns task completion metrics" do
        get "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}/metrics", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["metrics"]["task_completion"]).to include(
          "total_tasks", "completed_tasks", "completion_rate", "days_with_plans"
        )
      end

      it "returns goal progress metrics" do
        get "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}/metrics", headers: auth_headers(user)

        expect(json_response["metrics"]["goal_progress"]).to include(
          "total_goals", "completed_goals", "in_progress_goals", "at_risk_goals", "average_progress"
        )
      end

      it "returns reflection consistency metrics" do
        get "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}/metrics", headers: auth_headers(user)

        expect(json_response["metrics"]["reflection_consistency"]).to include(
          "total_days", "reflections_completed", "consistency_rate"
        )
      end

      it "calculates accurate task metrics" do
        month_start = monthly_review.month
        plan = create(:daily_plan, user: user, family: family, date: month_start + 5.days)
        create_list(:daily_task, 2, :completed, daily_plan: plan)
        create(:daily_task, :incomplete, daily_plan: plan)

        get "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}/metrics", headers: auth_headers(user)

        task_metrics = json_response["metrics"]["task_completion"]
        expect(task_metrics["total_tasks"]).to eq(3)
        expect(task_metrics["completed_tasks"]).to eq(2)
        expect(task_metrics["completion_rate"]).to eq(67)
        expect(task_metrics["days_with_plans"]).to eq(1)
      end

      it "calculates accurate goal metrics" do
        create(:goal, family: family, creator: user, status: :completed, progress: 100, visibility: :family)
        create(:goal, family: family, creator: user, status: :in_progress, progress: 50, visibility: :family)

        get "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}/metrics", headers: auth_headers(user)

        goal_metrics = json_response["metrics"]["goal_progress"]
        expect(goal_metrics["total_goals"]).to eq(2)
        expect(goal_metrics["completed_goals"]).to eq(1)
        expect(goal_metrics["in_progress_goals"]).to eq(1)
        expect(goal_metrics["average_progress"]).to eq(75)
      end

      it "calculates accurate reflection consistency metrics" do
        month_start = monthly_review.month
        plan = create(:daily_plan, user: user, family: family, date: month_start + 3.days)
        create(:reflection, :evening, user: user, family: family, daily_plan: plan)

        get "/api/v1/families/#{family.id}/monthly_reviews/#{monthly_review.id}/metrics", headers: auth_headers(user)

        reflection_metrics = json_response["metrics"]["reflection_consistency"]
        expect(reflection_metrics["total_days"]).to eq(Time.days_in_month(month_start.month, month_start.year))
        expect(reflection_metrics["reflections_completed"]).to eq(1)
      end
    end

    context "when viewing another family member's review metrics" do
      let(:other_member) { create(:user) }
      let(:other_review) { create(:monthly_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns metrics" do
        get "/api/v1/families/#{family.id}/monthly_reviews/#{other_review.id}/metrics", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response).to have_key("metrics")
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
