# frozen_string_literal: true

module Api
  module V1
    class WeeklyReviewsController < BaseController
      # Permitted scalar params for weekly review updates
      PERMITTED_SCALAR_PARAMS = %i[
        lessons_learned completed source_review_completed wins_shipped losses_friction
        workouts_completed workouts_planned walks_completed walks_planned
        writing_sessions_completed writing_sessions_planned house_resets_completed house_resets_planned
        meals_prepped_held metrics_notes daily_focus_used_every_day weekly_priorities_clear
        cleaning_system_held training_volume_sustainable system_to_adjust weekly_priorities
        kill_list workouts_blocked monday_top_3_decided monday_focus_card_prepped
      ].freeze

      # Array params (legacy fields)
      PERMITTED_ARRAY_PARAMS = { wins: [], challenges: [], next_week_priorities: [] }.freeze

      before_action :set_family
      before_action :set_weekly_review, only: %i[show update destroy]

      def index
        authorize @family, policy_class: WeeklyReviewPolicy

        @reviews = policy_scope(WeeklyReview)
                   .where(family: @family, user: current_user)
                   .mentioned_by(params[:mentioned_by])
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
        params.require(:weekly_review).permit(*PERMITTED_SCALAR_PARAMS, **PERMITTED_ARRAY_PARAMS)
      end

      def weekly_review_response(review, include_metrics: false)
        response = review_attributes(review)
        response[:metrics] = review.metrics if include_metrics
        response[:daily_plans] = daily_plans_summary(review)
        response[:habit_tally] = review.habit_tally if include_metrics
        response
      end

      def daily_plans_summary(review)
        review.daily_plans.map do |plan|
          { id: plan.id, date: plan.date }
        end
      end

      def review_attributes(review)
        base_attributes(review).merge(legacy_attributes(review)).merge(template_attributes(review))
      end

      def base_attributes(review)
        {
          id: review.id, week_start_date: review.week_start_date,
          user_id: review.user_id, family_id: review.family_id,
          created_at: review.created_at, updated_at: review.updated_at
        }
      end

      def legacy_attributes(review)
        {
          wins: review.wins || [], challenges: review.challenges || [],
          next_week_priorities: review.next_week_priorities || [],
          lessons_learned: review.lessons_learned, completed: review.completed
        }
      end

      def template_attributes(review)
        review_section_attrs(review).merge(metrics_section_attrs(review))
                                    .merge(system_health_attrs(review)).merge(forward_setup_attrs(review))
      end

      def review_section_attrs(review)
        {
          source_review_completed: review.source_review_completed,
          wins_shipped: review.wins_shipped, losses_friction: review.losses_friction
        }
      end

      def metrics_section_attrs(review)
        {
          workouts_completed: review.workouts_completed, workouts_planned: review.workouts_planned,
          walks_completed: review.walks_completed, walks_planned: review.walks_planned,
          writing_sessions_completed: review.writing_sessions_completed,
          writing_sessions_planned: review.writing_sessions_planned,
          house_resets_completed: review.house_resets_completed, house_resets_planned: review.house_resets_planned,
          meals_prepped_held: review.meals_prepped_held, metrics_notes: review.metrics_notes
        }
      end

      def system_health_attrs(review)
        {
          daily_focus_used_every_day: review.daily_focus_used_every_day,
          weekly_priorities_clear: review.weekly_priorities_clear,
          cleaning_system_held: review.cleaning_system_held,
          training_volume_sustainable: review.training_volume_sustainable,
          system_to_adjust: review.system_to_adjust, weekly_priorities: review.weekly_priorities,
          kill_list: review.kill_list
        }
      end

      def forward_setup_attrs(review)
        {
          workouts_blocked: review.workouts_blocked,
          monday_top_3_decided: review.monday_top_3_decided,
          monday_focus_card_prepped: review.monday_focus_card_prepped
        }
      end

      def record_weekly_review_streak
        StreakService.record_weekly_review(user: current_user, date: @weekly_review.week_start_date)
      end
    end
  end
end
