# frozen_string_literal: true

module Api
  module V1
    class AnnualReviewsController < BaseController
      before_action :set_family
      before_action :set_annual_review, only: %i[show update destroy]

      def index
        authorize @family, policy_class: AnnualReviewPolicy

        @reviews = policy_scope(AnnualReview)
                   .where(family: @family, user: current_user)
                   .order(year: :desc)

        render json: { annual_reviews: @reviews.map { |r| annual_review_response(r, include_metrics: false) } }
      end

      def current
        authorize @family, policy_class: AnnualReviewPolicy

        @annual_review = AnnualReview.find_or_create_for_current_year(user: current_user, family: @family)

        render json: annual_review_response(@annual_review, include_metrics: true)
      end

      def show
        authorize @annual_review

        render json: annual_review_response(@annual_review, include_metrics: true)
      end

      def update
        authorize @annual_review

        if @annual_review.update(annual_review_params)
          render json: {
            message: "Annual review updated successfully.",
            annual_review: annual_review_response(@annual_review, include_metrics: true)
          }
        else
          render_errors(@annual_review.errors.full_messages)
        end
      end

      def destroy
        authorize @annual_review

        @annual_review.destroy
        render json: { message: "Annual review deleted successfully." }
      end

      def metrics
        @annual_review = @family.annual_reviews.find(params[:id])
        authorize @annual_review, :show?

        render json: { metrics: @annual_review.metrics }
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def set_annual_review
        @annual_review = @family.annual_reviews.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Annual review not found" }, status: :not_found
      end

      def annual_review_params
        params.require(:annual_review).permit(
          :lessons_learned,
          :next_year_theme,
          :completed,
          year_highlights: [],
          year_challenges: [],
          gratitude: [],
          next_year_goals: []
        )
      end

      def annual_review_response(review, include_metrics: false)
        response = review_attributes(review)
        response[:metrics] = review.metrics if include_metrics
        response
      end

      def review_attributes(review)
        {
          id: review.id,
          year: review.year,
          user_id: review.user_id,
          family_id: review.family_id,
          year_highlights: review.year_highlights || [],
          year_challenges: review.year_challenges || [],
          lessons_learned: review.lessons_learned,
          gratitude: review.gratitude || [],
          next_year_theme: review.next_year_theme,
          next_year_goals: review.next_year_goals || [],
          completed: review.completed,
          created_at: review.created_at,
          updated_at: review.updated_at
        }
      end
    end
  end
end
