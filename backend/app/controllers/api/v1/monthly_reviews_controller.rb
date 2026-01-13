# frozen_string_literal: true

module Api
  module V1
    class MonthlyReviewsController < BaseController
      before_action :set_family
      before_action :set_monthly_review, only: %i[show update destroy]

      def index
        authorize @family, policy_class: MonthlyReviewPolicy

        @reviews = policy_scope(MonthlyReview)
                   .where(family: @family, user: current_user)
                   .order(month: :desc)

        render json: { monthly_reviews: @reviews.map { |r| monthly_review_response(r, include_metrics: false) } }
      end

      def current
        authorize @family, policy_class: MonthlyReviewPolicy

        @monthly_review = MonthlyReview.find_or_create_for_current_month(user: current_user, family: @family)

        render json: monthly_review_response(@monthly_review, include_metrics: true)
      end

      def show
        authorize @monthly_review

        render json: monthly_review_response(@monthly_review, include_metrics: true)
      end

      def update
        authorize @monthly_review

        if @monthly_review.update(monthly_review_params)
          render json: {
            message: "Monthly review updated successfully.",
            monthly_review: monthly_review_response(@monthly_review, include_metrics: true)
          }
        else
          render_errors(@monthly_review.errors.full_messages)
        end
      end

      def destroy
        authorize @monthly_review

        @monthly_review.destroy
        render json: { message: "Monthly review deleted successfully." }
      end

      def metrics
        @monthly_review = @family.monthly_reviews.find(params[:id])
        authorize @monthly_review, :show?

        render json: { metrics: @monthly_review.metrics }
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def set_monthly_review
        @monthly_review = @family.monthly_reviews.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Monthly review not found" }, status: :not_found
      end

      def monthly_review_params
        params.require(:monthly_review).permit(
          :lessons_learned,
          :completed,
          highlights: [],
          challenges: [],
          next_month_focus: []
        )
      end

      def monthly_review_response(review, include_metrics: false)
        response = review_attributes(review)
        response[:metrics] = review.metrics if include_metrics
        response
      end

      def review_attributes(review)
        {
          id: review.id,
          month: review.month,
          user_id: review.user_id,
          family_id: review.family_id,
          highlights: review.highlights || [],
          challenges: review.challenges || [],
          next_month_focus: review.next_month_focus || [],
          lessons_learned: review.lessons_learned,
          completed: review.completed,
          created_at: review.created_at,
          updated_at: review.updated_at
        }
      end
    end
  end
end
