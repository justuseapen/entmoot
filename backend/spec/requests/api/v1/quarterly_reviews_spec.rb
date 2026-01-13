# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::QuarterlyReviews" do
  let(:user) { create(:user) }
  let(:family) { create(:family, timezone: "America/New_York") }

  before { create(:family_membership, :adult, family: family, user: user) }

  describe "GET /api/v1/families/:family_id/quarterly_reviews" do
    context "when user is authenticated and a family member" do
      it "returns the user's quarterly reviews" do
        review1 = create(:quarterly_review, user: user, family: family)
        review2 = create(:quarterly_review, :last_quarter, user: user, family: family)

        get "/api/v1/families/#{family.id}/quarterly_reviews", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["quarterly_reviews"].length).to eq(2)
        expect(json_response["quarterly_reviews"].pluck("id")).to contain_exactly(review1.id, review2.id)
      end

      it "returns reviews ordered by quarter_start_date descending" do
        create(:quarterly_review, :two_quarters_ago, user: user, family: family)
        create(:quarterly_review, :last_quarter, user: user, family: family)
        create(:quarterly_review, user: user, family: family)

        get "/api/v1/families/#{family.id}/quarterly_reviews", headers: auth_headers(user)

        dates = json_response["quarterly_reviews"].pluck("quarter_start_date")
        expect(dates).to eq(dates.sort.reverse)
      end

      it "does not include other users' reviews" do
        other_user = create(:user)
        create(:family_membership, :adult, family: family, user: other_user)
        create(:quarterly_review, user: other_user, family: family)
        user_review = create(:quarterly_review, user: user, family: family)

        get "/api/v1/families/#{family.id}/quarterly_reviews", headers: auth_headers(user)

        expect(json_response["quarterly_reviews"].length).to eq(1)
        expect(json_response["quarterly_reviews"].first["id"]).to eq(user_review.id)
      end

      it "does not include metrics in list view" do
        create(:quarterly_review, user: user, family: family)

        get "/api/v1/families/#{family.id}/quarterly_reviews", headers: auth_headers(user)

        expect(json_response["quarterly_reviews"].first).not_to have_key("metrics")
      end
    end

    context "when user is not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        get "/api/v1/families/#{other_family.id}/quarterly_reviews", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/families/#{family.id}/quarterly_reviews"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/quarterly_reviews/current" do
    context "when user is authenticated and a family member" do
      it "creates a new quarterly review if none exists" do
        expect do
          get "/api/v1/families/#{family.id}/quarterly_reviews/current", headers: auth_headers(user)
        end.to change(QuarterlyReview, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(json_response["user_id"]).to eq(user.id)
        expect(json_response["family_id"]).to eq(family.id)
      end

      it "returns existing review if one exists for this quarter" do
        quarter_start = QuarterlyReview.quarter_start_date_for(family)
        existing_review = create(:quarterly_review, user: user, family: family, quarter_start_date: quarter_start)

        expect do
          get "/api/v1/families/#{family.id}/quarterly_reviews/current", headers: auth_headers(user)
        end.not_to change(QuarterlyReview, :count)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(existing_review.id)
      end

      it "includes metrics in response" do
        get "/api/v1/families/#{family.id}/quarterly_reviews/current", headers: auth_headers(user)

        expect(json_response).to have_key("metrics")
        expect(json_response["metrics"]).to have_key("goal_completion")
        expect(json_response["metrics"]).to have_key("monthly_review_completion")
        expect(json_response["metrics"]).to have_key("habit_consistency")
      end

      it "includes all review fields" do
        get "/api/v1/families/#{family.id}/quarterly_reviews/current", headers: auth_headers(user)

        expect(json_response).to include(
          "id", "quarter_start_date", "user_id", "family_id",
          "achievements", "obstacles", "next_quarter_objectives",
          "insights", "completed"
        )
      end
    end

    context "when user is not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        get "/api/v1/families/#{other_family.id}/quarterly_reviews/current", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/quarterly_reviews/:id" do
    let(:quarterly_review) { create(:quarterly_review, :with_content, user: user, family: family) }

    context "when viewing own review" do
      it "returns the quarterly review" do
        get "/api/v1/families/#{family.id}/quarterly_reviews/#{quarterly_review.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(quarterly_review.id)
      end

      it "includes all fields" do
        get "/api/v1/families/#{family.id}/quarterly_reviews/#{quarterly_review.id}", headers: auth_headers(user)

        expect(json_response["achievements"]).to eq(quarterly_review.achievements)
        expect(json_response["obstacles"]).to eq(quarterly_review.obstacles)
        expect(json_response["next_quarter_objectives"]).to eq(quarterly_review.next_quarter_objectives)
        expect(json_response["insights"]).to eq(quarterly_review.insights)
      end

      it "includes metrics" do
        get "/api/v1/families/#{family.id}/quarterly_reviews/#{quarterly_review.id}", headers: auth_headers(user)

        expect(json_response).to have_key("metrics")
      end
    end

    context "when viewing another family member's review" do
      let(:other_member) { create(:user) }
      let(:other_review) { create(:quarterly_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns the quarterly review" do
        get "/api/v1/families/#{family.id}/quarterly_reviews/#{other_review.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(other_review.id)
      end
    end

    context "when review does not exist" do
      it "returns not found" do
        get "/api/v1/families/#{family.id}/quarterly_reviews/999999", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "PATCH /api/v1/families/:family_id/quarterly_reviews/:id" do
    let(:quarterly_review) { create(:quarterly_review, user: user, family: family) }

    context "when updating own review" do
      it "updates achievements" do
        patch "/api/v1/families/#{family.id}/quarterly_reviews/#{quarterly_review.id}",
              params: { quarterly_review: { achievements: ["Launched new feature", "Grew team by 2"] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Quarterly review updated successfully.")
        expect(json_response["quarterly_review"]["achievements"]).to eq(["Launched new feature", "Grew team by 2"])
      end

      it "updates obstacles" do
        patch "/api/v1/families/#{family.id}/quarterly_reviews/#{quarterly_review.id}",
              params: { quarterly_review: { obstacles: ["Technical debt", "Team capacity"] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["quarterly_review"]["obstacles"]).to eq(["Technical debt", "Team capacity"])
      end

      it "updates next_quarter_objectives" do
        objectives = ["Scale infrastructure", "Hire", "Documentation"]
        patch "/api/v1/families/#{family.id}/quarterly_reviews/#{quarterly_review.id}",
              params: { quarterly_review: { next_quarter_objectives: objectives } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["quarterly_review"]["next_quarter_objectives"]).to eq(objectives)
      end

      it "updates insights" do
        patch "/api/v1/families/#{family.id}/quarterly_reviews/#{quarterly_review.id}",
              params: { quarterly_review: { insights: "Focus on automation pays dividends" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["quarterly_review"]["insights"]).to eq("Focus on automation pays dividends")
      end

      it "updates completed status" do
        patch "/api/v1/families/#{family.id}/quarterly_reviews/#{quarterly_review.id}",
              params: { quarterly_review: { completed: true } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["quarterly_review"]["completed"]).to be(true)
      end

      it "updates multiple fields at once" do
        params = { achievements: ["Achievement"], obstacles: ["Issue"], completed: true }
        patch "/api/v1/families/#{family.id}/quarterly_reviews/#{quarterly_review.id}",
              params: { quarterly_review: params }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["quarterly_review"]).to include(
          "achievements" => ["Achievement"], "obstacles" => ["Issue"], "completed" => true
        )
      end
    end

    context "when trying to update another user's review" do
      let(:other_member) { create(:user) }
      let(:other_review) { create(:quarterly_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns forbidden" do
        patch "/api/v1/families/#{family.id}/quarterly_reviews/#{other_review.id}",
              params: { quarterly_review: { insights: "Hacked!" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/families/:family_id/quarterly_reviews/:id" do
    context "when deleting own review" do
      let!(:quarterly_review) { create(:quarterly_review, user: user, family: family) }

      it "deletes the review" do
        expect do
          delete "/api/v1/families/#{family.id}/quarterly_reviews/#{quarterly_review.id}", headers: auth_headers(user)
        end.to change(QuarterlyReview, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Quarterly review deleted successfully.")
      end
    end

    context "when trying to delete another user's review" do
      let(:other_member) { create(:user) }
      let!(:other_review) { create(:quarterly_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns forbidden" do
        expect do
          delete "/api/v1/families/#{family.id}/quarterly_reviews/#{other_review.id}", headers: auth_headers(user)
        end.not_to change(QuarterlyReview, :count)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/quarterly_reviews/:id/metrics" do
    let(:quarterly_review) { create(:quarterly_review, user: user, family: family) }

    context "when viewing own review metrics" do
      def metrics_url(review)
        "/api/v1/families/#{family.id}/quarterly_reviews/#{review.id}/metrics"
      end

      it "returns goal completion metrics" do
        get metrics_url(quarterly_review), headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["metrics"]["goal_completion"]).to include(
          "total_goals", "completed_goals", "in_progress_goals", "at_risk_goals", "average_progress"
        )
      end

      it "returns monthly review completion metrics" do
        get metrics_url(quarterly_review), headers: auth_headers(user)

        expect(json_response["metrics"]["monthly_review_completion"]).to include(
          "total_months", "completed_reviews", "completion_rate"
        )
      end

      it "returns habit consistency metrics" do
        get metrics_url(quarterly_review), headers: auth_headers(user)

        expect(json_response["metrics"]["habit_consistency"]).to include(
          "total_weeks", "completed_weekly_reviews", "consistency_rate"
        )
      end

      it "calculates accurate goal metrics" do
        create(:goal, family: family, creator: user, status: :completed, progress: 100, time_scale: :quarterly,
                      visibility: :family)
        create(:goal, family: family, creator: user, status: :in_progress, progress: 50, time_scale: :quarterly,
                      visibility: :family)

        get metrics_url(quarterly_review), headers: auth_headers(user)

        goal_metrics = json_response["metrics"]["goal_completion"]
        expect(goal_metrics["total_goals"]).to eq(2)
        expect(goal_metrics["completed_goals"]).to eq(1)
        expect(goal_metrics["in_progress_goals"]).to eq(1)
        expect(goal_metrics["average_progress"]).to eq(75)
      end

      it "calculates accurate monthly review completion metrics" do
        quarter_start = quarterly_review.quarter_start_date
        # Create completed monthly review within the quarter
        create(:monthly_review, :completed, user: user, family: family, month: quarter_start)

        get metrics_url(quarterly_review), headers: auth_headers(user)

        monthly_metrics = json_response["metrics"]["monthly_review_completion"]
        expect(monthly_metrics["total_months"]).to eq(3)
        expect(monthly_metrics["completed_reviews"]).to eq(1)
        expect(monthly_metrics["completion_rate"]).to eq(33)
      end

      it "calculates accurate weekly review consistency metrics" do
        quarter_start = quarterly_review.quarter_start_date
        # Create completed weekly reviews within the quarter
        create(:weekly_review, :completed, user: user, family: family, week_start_date: quarter_start)
        create(:weekly_review, :completed, user: user, family: family, week_start_date: quarter_start + 1.week)

        get metrics_url(quarterly_review), headers: auth_headers(user)

        habit_metrics = json_response["metrics"]["habit_consistency"]
        expect(habit_metrics["total_weeks"]).to eq(13)
        expect(habit_metrics["completed_weekly_reviews"]).to eq(2)
        # 2/13 = 15.38% -> rounds to 15
        expect(habit_metrics["consistency_rate"]).to eq(15)
      end
    end

    context "when viewing another family member's review metrics" do
      let(:other_member) { create(:user) }
      let(:other_review) { create(:quarterly_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns metrics" do
        get "/api/v1/families/#{family.id}/quarterly_reviews/#{other_review.id}/metrics", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response).to have_key("metrics")
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
