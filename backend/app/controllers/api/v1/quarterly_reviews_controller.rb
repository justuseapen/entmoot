# frozen_string_literal: true

module Api
  module V1
    class QuarterlyReviewsController < BaseController
      before_action :set_family
      before_action :set_quarterly_review, only: %i[show update destroy]

      def index
        authorize @family, policy_class: QuarterlyReviewPolicy

        @reviews = policy_scope(QuarterlyReview)
                   .where(family: @family, user: current_user)
                   .mentioned_by(params[:mentioned_by])
                   .order(quarter_start_date: :desc)

        render json: { quarterly_reviews: @reviews.map { |r| quarterly_review_response(r, include_metrics: false) } }
      end

      def current
        authorize @family, policy_class: QuarterlyReviewPolicy

        @quarterly_review = QuarterlyReview.find_or_create_for_current_quarter(user: current_user, family: @family)

        render json: quarterly_review_response(@quarterly_review, include_metrics: true)
      end

      def show
        authorize @quarterly_review

        render json: quarterly_review_response(@quarterly_review, include_metrics: true)
      end

      def update
        authorize @quarterly_review

        if @quarterly_review.update(quarterly_review_params)
          render json: {
            message: "Quarterly review updated successfully.",
            quarterly_review: quarterly_review_response(@quarterly_review, include_metrics: true)
          }
        else
          render_errors(@quarterly_review.errors.full_messages)
        end
      end

      def destroy
        authorize @quarterly_review

        @quarterly_review.destroy
        render json: { message: "Quarterly review deleted successfully." }
      end

      def metrics
        @quarterly_review = @family.quarterly_reviews.find(params[:id])
        authorize @quarterly_review, :show?

        render json: { metrics: @quarterly_review.metrics }
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def set_quarterly_review
        @quarterly_review = @family.quarterly_reviews.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Quarterly review not found" }, status: :not_found
      end

      def quarterly_review_params
        params.require(:quarterly_review).permit(
          :insights,
          :completed,
          achievements: [],
          obstacles: [],
          next_quarter_objectives: []
        )
      end

      def quarterly_review_response(review, include_metrics: false)
        response = review_attributes(review)
        response[:metrics] = review.metrics if include_metrics
        response
      end

      def review_attributes(review)
        {
          id: review.id,
          quarter_start_date: review.quarter_start_date,
          user_id: review.user_id,
          family_id: review.family_id,
          achievements: review.achievements || [],
          obstacles: review.obstacles || [],
          next_quarter_objectives: review.next_quarter_objectives || [],
          insights: review.insights,
          completed: review.completed,
          created_at: review.created_at,
          updated_at: review.updated_at
        }
      end
    end
  end
end
