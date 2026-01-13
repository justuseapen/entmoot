# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::AnnualReviews" do
  let(:user) { create(:user) }
  let(:family) { create(:family, timezone: "America/New_York") }

  before { create(:family_membership, :adult, family: family, user: user) }

  describe "GET /api/v1/families/:family_id/annual_reviews" do
    context "when user is authenticated and a family member" do
      it "returns the user's annual reviews" do
        review1 = create(:annual_review, user: user, family: family)
        review2 = create(:annual_review, :last_year, user: user, family: family)

        get "/api/v1/families/#{family.id}/annual_reviews", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["annual_reviews"].length).to eq(2)
        expect(json_response["annual_reviews"].pluck("id")).to contain_exactly(review1.id, review2.id)
      end

      it "returns reviews ordered by year descending" do
        create(:annual_review, :two_years_ago, user: user, family: family)
        create(:annual_review, :last_year, user: user, family: family)
        create(:annual_review, user: user, family: family)

        get "/api/v1/families/#{family.id}/annual_reviews", headers: auth_headers(user)

        years = json_response["annual_reviews"].pluck("year")
        expect(years).to eq(years.sort.reverse)
      end

      it "does not include other users' reviews" do
        other_user = create(:user)
        create(:family_membership, :adult, family: family, user: other_user)
        create(:annual_review, user: other_user, family: family)
        user_review = create(:annual_review, user: user, family: family)

        get "/api/v1/families/#{family.id}/annual_reviews", headers: auth_headers(user)

        expect(json_response["annual_reviews"].length).to eq(1)
        expect(json_response["annual_reviews"].first["id"]).to eq(user_review.id)
      end

      it "does not include metrics in list view" do
        create(:annual_review, user: user, family: family)

        get "/api/v1/families/#{family.id}/annual_reviews", headers: auth_headers(user)

        expect(json_response["annual_reviews"].first).not_to have_key("metrics")
      end
    end

    context "when user is not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        get "/api/v1/families/#{other_family.id}/annual_reviews", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/families/#{family.id}/annual_reviews"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/annual_reviews/current" do
    context "when user is authenticated and a family member" do
      it "creates a new annual review if none exists" do
        expect do
          get "/api/v1/families/#{family.id}/annual_reviews/current", headers: auth_headers(user)
        end.to change(AnnualReview, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(json_response["user_id"]).to eq(user.id)
        expect(json_response["family_id"]).to eq(family.id)
      end

      it "returns existing review if one exists for this year" do
        current_year = AnnualReview.year_for(family)
        existing_review = create(:annual_review, user: user, family: family, year: current_year)

        expect do
          get "/api/v1/families/#{family.id}/annual_reviews/current", headers: auth_headers(user)
        end.not_to change(AnnualReview, :count)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(existing_review.id)
      end

      it "includes metrics in response" do
        get "/api/v1/families/#{family.id}/annual_reviews/current", headers: auth_headers(user)

        expect(json_response).to have_key("metrics")
        expect(json_response["metrics"]).to have_key("goals_achieved")
        expect(json_response["metrics"]).to have_key("streaks_maintained")
        expect(json_response["metrics"]).to have_key("review_consistency")
      end

      it "includes all review fields" do
        get "/api/v1/families/#{family.id}/annual_reviews/current", headers: auth_headers(user)

        expect(json_response).to include(
          "id", "year", "user_id", "family_id",
          "year_highlights", "year_challenges", "lessons_learned",
          "gratitude", "next_year_theme", "next_year_goals", "completed"
        )
      end
    end

    context "when user is not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        get "/api/v1/families/#{other_family.id}/annual_reviews/current", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/annual_reviews/:id" do
    let(:annual_review) { create(:annual_review, :with_content, user: user, family: family) }

    context "when viewing own review" do
      it "returns the annual review" do
        get "/api/v1/families/#{family.id}/annual_reviews/#{annual_review.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(annual_review.id)
      end

      it "includes all fields" do
        get "/api/v1/families/#{family.id}/annual_reviews/#{annual_review.id}", headers: auth_headers(user)

        expect(json_response["year_highlights"]).to eq(annual_review.year_highlights)
        expect(json_response["year_challenges"]).to eq(annual_review.year_challenges)
        expect(json_response["lessons_learned"]).to eq(annual_review.lessons_learned)
        expect(json_response["gratitude"]).to eq(annual_review.gratitude)
        expect(json_response["next_year_theme"]).to eq(annual_review.next_year_theme)
        expect(json_response["next_year_goals"]).to eq(annual_review.next_year_goals)
      end

      it "includes metrics" do
        get "/api/v1/families/#{family.id}/annual_reviews/#{annual_review.id}", headers: auth_headers(user)

        expect(json_response).to have_key("metrics")
      end
    end

    context "when viewing another family member's review" do
      let(:other_member) { create(:user) }
      let(:other_review) { create(:annual_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns the annual review" do
        get "/api/v1/families/#{family.id}/annual_reviews/#{other_review.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(other_review.id)
      end
    end

    context "when review does not exist" do
      it "returns not found" do
        get "/api/v1/families/#{family.id}/annual_reviews/999999", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "PATCH /api/v1/families/:family_id/annual_reviews/:id" do
    let(:annual_review) { create(:annual_review, user: user, family: family) }

    context "when updating own review" do
      it "updates year_highlights" do
        patch "/api/v1/families/#{family.id}/annual_reviews/#{annual_review.id}",
              params: { annual_review: { year_highlights: ["Achieved major milestone", "Family grew closer"] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Annual review updated successfully.")
        expect(json_response["annual_review"]["year_highlights"]).to eq(
          ["Achieved major milestone", "Family grew closer"]
        )
      end

      it "updates year_challenges" do
        patch "/api/v1/families/#{family.id}/annual_reviews/#{annual_review.id}",
              params: { annual_review: { year_challenges: ["Time management", "Work-life balance"] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["annual_review"]["year_challenges"]).to eq(
          ["Time management", "Work-life balance"]
        )
      end

      it "updates lessons_learned" do
        patch "/api/v1/families/#{family.id}/annual_reviews/#{annual_review.id}",
              params: { annual_review: { lessons_learned: "Consistency beats perfection" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["annual_review"]["lessons_learned"]).to eq("Consistency beats perfection")
      end

      it "updates gratitude" do
        gratitude_items = ["Family health", "Community support", "New opportunities"]
        patch "/api/v1/families/#{family.id}/annual_reviews/#{annual_review.id}",
              params: { annual_review: { gratitude: gratitude_items } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["annual_review"]["gratitude"]).to eq(gratitude_items)
      end

      it "updates next_year_theme" do
        patch "/api/v1/families/#{family.id}/annual_reviews/#{annual_review.id}",
              params: { annual_review: { next_year_theme: "Adventure & Discovery" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["annual_review"]["next_year_theme"]).to eq("Adventure & Discovery")
      end

      it "updates next_year_goals" do
        goals = ["Travel more", "Learn new skills", "Strengthen connections"]
        patch "/api/v1/families/#{family.id}/annual_reviews/#{annual_review.id}",
              params: { annual_review: { next_year_goals: goals } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["annual_review"]["next_year_goals"]).to eq(goals)
      end

      it "updates completed status" do
        patch "/api/v1/families/#{family.id}/annual_reviews/#{annual_review.id}",
              params: { annual_review: { completed: true } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["annual_review"]["completed"]).to be(true)
      end

      it "updates multiple fields at once" do
        params = {
          year_highlights: ["Highlight"],
          year_challenges: ["Challenge"],
          next_year_theme: "New Theme",
          completed: true
        }
        patch "/api/v1/families/#{family.id}/annual_reviews/#{annual_review.id}",
              params: { annual_review: params }, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["annual_review"]).to include(
          "year_highlights" => ["Highlight"],
          "year_challenges" => ["Challenge"],
          "next_year_theme" => "New Theme",
          "completed" => true
        )
      end
    end

    context "when trying to update another user's review" do
      let(:other_member) { create(:user) }
      let(:other_review) { create(:annual_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns forbidden" do
        patch "/api/v1/families/#{family.id}/annual_reviews/#{other_review.id}",
              params: { annual_review: { lessons_learned: "Hacked!" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/families/:family_id/annual_reviews/:id" do
    context "when deleting own review" do
      let!(:annual_review) { create(:annual_review, user: user, family: family) }

      it "deletes the review" do
        expect do
          delete "/api/v1/families/#{family.id}/annual_reviews/#{annual_review.id}", headers: auth_headers(user)
        end.to change(AnnualReview, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Annual review deleted successfully.")
      end
    end

    context "when trying to delete another user's review" do
      let(:other_member) { create(:user) }
      let!(:other_review) { create(:annual_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns forbidden" do
        expect do
          delete "/api/v1/families/#{family.id}/annual_reviews/#{other_review.id}", headers: auth_headers(user)
        end.not_to change(AnnualReview, :count)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/annual_reviews/:id/metrics" do
    let(:annual_review) { create(:annual_review, user: user, family: family) }

    def metrics_url(review)
      "/api/v1/families/#{family.id}/annual_reviews/#{review.id}/metrics"
    end

    context "when viewing own review metrics" do
      it "returns goals_achieved metrics" do
        get metrics_url(annual_review), headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["metrics"]["goals_achieved"]).to include(
          "total_goals", "completed_goals", "in_progress_goals", "abandoned_goals", "average_progress"
        )
      end

      it "returns streaks_maintained metrics" do
        get metrics_url(annual_review), headers: auth_headers(user)

        expect(json_response["metrics"]["streaks_maintained"]).to include(
          "longest_daily_planning_streak", "longest_reflection_streak", "longest_weekly_review_streak"
        )
      end

      it "returns review_consistency metrics" do
        get metrics_url(annual_review), headers: auth_headers(user)

        expect(json_response["metrics"]["review_consistency"]).to include(
          "quarterly_reviews_completed", "quarterly_reviews_total", "quarterly_completion_rate",
          "monthly_reviews_completed", "monthly_reviews_total", "monthly_completion_rate",
          "weekly_reviews_completed", "weekly_reviews_total", "weekly_completion_rate"
        )
      end

      it "calculates accurate goal metrics" do
        create(:goal, family: family, creator: user, status: :completed, progress: 100, time_scale: :annual,
                      visibility: :family)
        create(:goal, family: family, creator: user, status: :in_progress, progress: 50, time_scale: :annual,
                      visibility: :family)
        create(:goal, family: family, creator: user, status: :abandoned, progress: 20, time_scale: :annual,
                      visibility: :family)

        get metrics_url(annual_review), headers: auth_headers(user)

        goal_metrics = json_response["metrics"]["goals_achieved"]
        expect(goal_metrics["total_goals"]).to eq(3)
        expect(goal_metrics["completed_goals"]).to eq(1)
        expect(goal_metrics["in_progress_goals"]).to eq(1)
        expect(goal_metrics["abandoned_goals"]).to eq(1)
        expect(goal_metrics["average_progress"]).to eq(57) # (100 + 50 + 20) / 3 = 56.67 rounded
      end

      it "calculates accurate streak metrics" do
        create(:streak, user: user, streak_type: :daily_planning, current_count: 15, longest_count: 45)
        create(:streak, user: user, streak_type: :evening_reflection, current_count: 10, longest_count: 30)
        create(:streak, user: user, streak_type: :weekly_review, current_count: 5, longest_count: 20)

        get metrics_url(annual_review), headers: auth_headers(user)

        streak_metrics = json_response["metrics"]["streaks_maintained"]
        expect(streak_metrics["longest_daily_planning_streak"]).to eq(45)
        expect(streak_metrics["longest_reflection_streak"]).to eq(30)
        expect(streak_metrics["longest_weekly_review_streak"]).to eq(20)
      end

      it "calculates accurate quarterly review consistency metrics" do
        year_start = Date.new(annual_review.year, 1, 1)
        create(:quarterly_review, :completed, user: user, family: family, quarter_start_date: year_start)
        create(:quarterly_review, :completed, user: user, family: family, quarter_start_date: year_start + 3.months)

        get metrics_url(annual_review), headers: auth_headers(user)

        review_metrics = json_response["metrics"]["review_consistency"]
        expect(review_metrics["quarterly_reviews_completed"]).to eq(2)
        expect(review_metrics["quarterly_reviews_total"]).to eq(4)
        expect(review_metrics["quarterly_completion_rate"]).to eq(50)
      end

      it "calculates accurate monthly review consistency metrics" do
        year_start = Date.new(annual_review.year, 1, 1)
        create(:monthly_review, :completed, user: user, family: family, month: year_start)

        get metrics_url(annual_review), headers: auth_headers(user)

        review_metrics = json_response["metrics"]["review_consistency"]
        expect(review_metrics["monthly_reviews_completed"]).to eq(1)
        expect(review_metrics["monthly_reviews_total"]).to eq(12)
        expect(review_metrics["monthly_completion_rate"]).to eq(8) # 1/12 = 8.33% rounded
      end

      it "calculates accurate weekly review consistency metrics" do
        year_start = Date.new(annual_review.year, 1, 1)
        create(:weekly_review, :completed, user: user, family: family, week_start_date: year_start)
        create(:weekly_review, :completed, user: user, family: family, week_start_date: year_start + 1.week)
        create(:weekly_review, :completed, user: user, family: family, week_start_date: year_start + 2.weeks)

        get metrics_url(annual_review), headers: auth_headers(user)

        review_metrics = json_response["metrics"]["review_consistency"]
        expect(review_metrics["weekly_reviews_completed"]).to eq(3)
        expect(review_metrics["weekly_reviews_total"]).to eq(52)
        expect(review_metrics["weekly_completion_rate"]).to eq(6) # 3/52 = 5.77% rounded
      end
    end

    context "when viewing another family member's review metrics" do
      let(:other_member) { create(:user) }
      let(:other_review) { create(:annual_review, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns metrics" do
        get "/api/v1/families/#{family.id}/annual_reviews/#{other_review.id}/metrics", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response).to have_key("metrics")
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
