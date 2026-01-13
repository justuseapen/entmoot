# frozen_string_literal: true

module Api
  module V1
    class WeeklyReviewsController < BaseController
      before_action :set_family
      before_action :set_weekly_review, only: %i[show update destroy]

      def index
        authorize @family, policy_class: WeeklyReviewPolicy

        @reviews = policy_scope(WeeklyReview)
                   .where(family: @family, user: current_user)
                   .order(week_start_date: :desc)

        render json: { weekly_reviews: @reviews.map { |r| weekly_review_response(r, include_metrics: false) } }
      end

      def current
        authorize @family, policy_class: WeeklyReviewPolicy

        @weekly_review = WeeklyReview.find_or_create_for_current_week(user: current_user, family: @family)

        render json: weekly_review_response(@weekly_review, include_metrics: true)
      end

      def show
        authorize @weekly_review

        render json: weekly_review_response(@weekly_review, include_metrics: true)
      end

      def update
        authorize @weekly_review

        was_completed_before = @weekly_review.completed?

        if @weekly_review.update(weekly_review_params)
          # Record weekly review streak and award points if just completed
          if !was_completed_before && @weekly_review.completed?
            record_weekly_review_streak
            track_weekly_review_activity
            PointsService.award_weekly_review_completion(user: current_user, weekly_review: @weekly_review)
          end

          render json: {
            message: "Weekly review updated successfully.",
            weekly_review: weekly_review_response(@weekly_review, include_metrics: true)
          }
        else
          render_errors(@weekly_review.errors.full_messages)
        end
      end

      def destroy
        authorize @weekly_review

        @weekly_review.destroy
        render json: { message: "Weekly review deleted successfully." }
      end

      def metrics
        @weekly_review = @family.weekly_reviews.find(params[:id])
        authorize @weekly_review, :show?

        render json: { metrics: @weekly_review.metrics }
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def set_weekly_review
        @weekly_review = @family.weekly_reviews.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Weekly review not found" }, status: :not_found
      end

      def weekly_review_params
        params.require(:weekly_review).permit(
          :lessons_learned,
          :completed,
          wins: [],
          challenges: [],
          next_week_priorities: []
        )
      end

      def weekly_review_response(review, include_metrics: false)
        response = review_attributes(review)
        response[:metrics] = review.metrics if include_metrics
        response
      end

      def review_attributes(review)
        {
          id: review.id,
          week_start_date: review.week_start_date,
          user_id: review.user_id,
          family_id: review.family_id,
          wins: review.wins || [],
          challenges: review.challenges || [],
          next_week_priorities: review.next_week_priorities || [],
          lessons_learned: review.lessons_learned,
          completed: review.completed,
          created_at: review.created_at,
          updated_at: review.updated_at
        }
      end

      def record_weekly_review_streak
        StreakService.record_weekly_review(user: current_user, date: @weekly_review.week_start_date)
      end
    end
  end
end
