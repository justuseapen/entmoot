# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::WeeklyReviews" do
  let(:user) { create(:user) }
  let(:family) { create(:family, timezone: "America/New_York") }

  before { create(:family_membership, :adult, family: family, user: user) }

  describe "GET /api/v1/families/:family_id/weekly_reviews" do
    context "when user is authenticated and a family member" do
      it "returns the user's weekly reviews" do
        review1 = create(:weekly_review, user: user, family: family, week_start_date: Date.current.beginning_of_week)
        review2 = create(:weekly_review, :last_week, user: user, family: family)

        get "/api/v1/families/#{family.id}/weekly_reviews", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["weekly_reviews"].length).to eq(2)
        expect(json_response["weekly_reviews"].pluck("id")).to contain_exactly(review1.id, review2.id)
      end

      it "returns reviews ordered by week_start_date descending" do
        create(:weekly_review, :two_weeks_ago, user: user, family: family)
        create(:weekly_review, :last_week, user: user, family: family)
        create(:weekly_review, user: user, family: family, week_start_date: Date.current.beginning_of_week)

        get "/api/v1/families/#{family.id}/weekly_reviews", headers: auth_headers(user)

        dates = json_response["weekly_reviews"].pluck("week_start_date")
        expect(dates).to eq(dates.sort.reverse)
      end

      it "does not include other users' reviews" do
        other_user = create(:user)
        create(:family_membership, :adult, family: family, user: other_user)
        create(:weekly_review, user: other_user, family: family)
        week_start = Date.current.beginning_of_week
        user_review = create(:weekly_review, user: user, family: family, week_start_date: week_start)

        get "/api/v1/families/#{family.id}/weekly_reviews", headers: auth_headers(user)

        expect(json_response["weekly_reviews"].length).to eq(1)
        expect(json_response["weekly_reviews"].first["id"]).to eq(user_review.id)
      end

      it "does not include metrics in list view" do
        create(:weekly_review, user: user, family: family)

        get "/api/v1/families/#{family.id}/weekly_reviews", headers: auth_headers(user)

        expect(json_response["weekly_reviews"].first).not_to have_key("metrics")
      end
    end

    context "when user is not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        get "/api/v1/families/#{other_family.id}/weekly_reviews", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/families/#{family.id}/weekly_reviews"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/weekly_reviews/current" do
    context "when user is authenticated and a family member" do
      it "creates a new weekly review if none exists" do
        expect do
          get "/api/v1/families/#{family.id}/weekly_reviews/current", headers: auth_headers(user)
        end.to change(WeeklyReview, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(json_response["user_id"]).to eq(user.id)
        expect(json_response["family_id"]).to eq(family.id)
      end

      it "returns existing review if one exists for this week" do
        timezone = Time.find_zone("America/New_York")
        week_start = timezone.today.beginning_of_week(:monday)
        existing_review = create(:weekly_review, user: user, family: family, week_start_date: week_start)

        expect do
          get "/api/v1/families/#{family.id}/weekly_reviews/current", headers: auth_headers(user)
        end.not_to change(WeeklyReview, :count)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(existing_review.id)
      end

      it "includes metrics in response" do
        get "/api/v1/families/#{family.id}/weekly_reviews/current", headers: auth_headers(user)

        expect(json_response).to have_key("metrics")
        expect(json_response["metrics"]).to have_key("task_completion")
        expect(json_response["metrics"]).to have_key("goal_progress")
      end

      it "includes all review fields" do
        get "/api/v1/families/#{family.id}/weekly_reviews/current", headers: auth_headers(user)

        expect(json_response).to include(
          "id", "week_start_date", "user_id", "family_id",
          "wins", "challenges", "next_week_priorities",
          "lessons_learned", "completed"
        )
      end
    end

    context "when family uses Sunday as week start" do
      let(:family_sunday) { create(:family, timezone: "America/New_York", settings: { "week_start_day" => 0 }) }

      before { create(:family_membership, :adult, family: family_sunday, user: user) }

      it "uses Sunday as week start date" do
        get "/api/v1/families/#{family_sunday.id}/weekly_reviews/current", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        week_start = Date.parse(json_response["week_start_date"])
        expect(week_start.wday).to eq(0) # Sunday
      end
    end

    context "when user is not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        get "/api/v1/families/#{other_family.id}/weekly_reviews/current", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/weekly_reviews/:id" do
    let(:weekly_review) { create(:weekly_review, :with_content, user: user, family: family) }

    context "when viewing own review" do
      it "returns the weekly review" do
        get "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(weekly_review.id)
      end

      it "includes all fields" do
        get "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}", headers: auth_headers(user)

        expect(json_response["wins"]).to eq(weekly_review.wins)
        expect(json_response["challenges"]).to eq(weekly_review.challenges)
        expect(json_response["next_week_priorities"]).to eq(weekly_review.next_week_priorities)
        expect(json_response["lessons_learned"]).to eq(weekly_review.lessons_learned)
      end

      it "includes metrics" do
        get "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}", headers: auth_headers(user)

        expect(json_response).to have_key("metrics")
      end
    end

    context "when viewing another family member's review" do
      let(:other_member) { create(:user) }
      let(:other_review) { create(:weekly_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns the weekly review" do
        get "/api/v1/families/#{family.id}/weekly_reviews/#{other_review.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(other_review.id)
      end
    end

    context "when review does not exist" do
      it "returns not found" do
        get "/api/v1/families/#{family.id}/weekly_reviews/999999", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "PATCH /api/v1/families/:family_id/weekly_reviews/:id" do
    let(:weekly_review) { create(:weekly_review, user: user, family: family) }

    context "when updating own review" do
      it "updates wins" do
        patch "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}",
              params: { weekly_review: { wins: ["Completed project", "Great teamwork"] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Weekly review updated successfully.")
        expect(json_response["weekly_review"]["wins"]).to eq(["Completed project", "Great teamwork"])
      end

      it "updates challenges" do
        patch "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}",
              params: { weekly_review: { challenges: ["Tight deadline", "Technical issues"] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["weekly_review"]["challenges"]).to eq(["Tight deadline", "Technical issues"])
      end

      it "updates next_week_priorities" do
        patch "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}",
              params: { weekly_review: { next_week_priorities: ["Finish feature", "Code review", "Documentation"] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["weekly_review"]["next_week_priorities"]).to eq(
          ["Finish feature", "Code review", "Documentation"]
        )
      end

      it "updates lessons_learned" do
        patch "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}",
              params: { weekly_review: { lessons_learned: "Communication is key" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["weekly_review"]["lessons_learned"]).to eq("Communication is key")
      end

      it "updates completed status" do
        patch "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}",
              params: { weekly_review: { completed: true } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["weekly_review"]["completed"]).to be(true)
      end

      it "updates multiple fields at once" do
        params = { wins: ["Win"], challenges: ["Issue"], completed: true }
        patch "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}",
              params: { weekly_review: params }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["weekly_review"]).to include(
          "wins" => ["Win"], "challenges" => ["Issue"], "completed" => true
        )
      end
    end

    context "when trying to update another user's review" do
      let(:other_member) { create(:user) }
      let(:other_review) { create(:weekly_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns forbidden" do
        patch "/api/v1/families/#{family.id}/weekly_reviews/#{other_review.id}",
              params: { weekly_review: { lessons_learned: "Hacked!" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/families/:family_id/weekly_reviews/:id" do
    context "when deleting own review" do
      let!(:weekly_review) { create(:weekly_review, user: user, family: family) }

      it "deletes the review" do
        expect do
          delete "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}", headers: auth_headers(user)
        end.to change(WeeklyReview, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Weekly review deleted successfully.")
      end
    end

    context "when trying to delete another user's review" do
      let(:other_member) { create(:user) }
      let!(:other_review) { create(:weekly_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns forbidden" do
        expect do
          delete "/api/v1/families/#{family.id}/weekly_reviews/#{other_review.id}", headers: auth_headers(user)
        end.not_to change(WeeklyReview, :count)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/weekly_reviews/:id/metrics" do
    let(:weekly_review) { create(:weekly_review, user: user, family: family) }

    context "when viewing own review metrics" do
      it "returns task completion metrics" do
        get "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}/metrics", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["metrics"]["task_completion"]).to include(
          "total_tasks", "completed_tasks", "completion_rate", "days_with_plans"
        )
      end

      it "returns goal progress metrics" do
        get "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}/metrics", headers: auth_headers(user)

        expect(json_response["metrics"]["goal_progress"]).to include(
          "total_goals", "completed_goals", "in_progress_goals", "at_risk_goals", "average_progress"
        )
      end

      it "calculates accurate task metrics" do
        week_start = weekly_review.week_start_date
        plan = create(:daily_plan, user: user, family: family, date: week_start)
        create_list(:daily_task, 2, :completed, daily_plan: plan)
        create(:daily_task, :incomplete, daily_plan: plan)

        get "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}/metrics", headers: auth_headers(user)

        task_metrics = json_response["metrics"]["task_completion"]
        expect(task_metrics["total_tasks"]).to eq(3)
        expect(task_metrics["completed_tasks"]).to eq(2)
        expect(task_metrics["completion_rate"]).to eq(67)
        expect(task_metrics["days_with_plans"]).to eq(1)
      end

      it "calculates accurate goal metrics" do
        create(:goal, family: family, creator: user, status: :completed, progress: 100, visibility: :family)
        create(:goal, family: family, creator: user, status: :in_progress, progress: 50, visibility: :family)

        get "/api/v1/families/#{family.id}/weekly_reviews/#{weekly_review.id}/metrics", headers: auth_headers(user)

        goal_metrics = json_response["metrics"]["goal_progress"]
        expect(goal_metrics["total_goals"]).to eq(2)
        expect(goal_metrics["completed_goals"]).to eq(1)
        expect(goal_metrics["in_progress_goals"]).to eq(1)
        expect(goal_metrics["average_progress"]).to eq(75)
      end
    end

    context "when viewing another family member's review metrics" do
      let(:other_member) { create(:user) }
      let(:other_review) { create(:weekly_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns metrics" do
        get "/api/v1/families/#{family.id}/weekly_reviews/#{other_review.id}/metrics", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response).to have_key("metrics")
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
