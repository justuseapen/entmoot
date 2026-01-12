# frozen_string_literal: true

module Api
  module V1
    class PointsController < BaseController
      # GET /api/v1/users/me/points
      def index
        @entries = PointsService.recent_activity(current_user, limit: limit_param)

        render json: {
          points: {
            total: PointsService.total_points(current_user),
            this_week: PointsService.weekly_points(current_user),
            breakdown: PointsService.points_breakdown(current_user)
          },
          recent_activity: @entries.map { |entry| entry_response(entry) }
        }, status: :ok
      end

      private

      def limit_param
        limit = params[:limit].to_i
        limit.positive? && limit <= 100 ? limit : 20
      end

      def entry_response(entry)
        {
          id: entry.id,
          points: entry.points,
          activity_type: entry.activity_type,
          activity_label: activity_label(entry.activity_type),
          metadata: entry.metadata,
          created_at: entry.created_at
        }
      end

      def activity_label(activity_type)
        labels = {
          "complete_task" => "Completed a task",
          "complete_daily_plan" => "Completed daily plan",
          "complete_reflection" => "Completed reflection",
          "complete_weekly_review" => "Completed weekly review",
          "create_goal" => "Created a goal",
          "complete_goal" => "Completed a goal",
          "earn_badge" => "Earned a badge",
          "streak_milestone" => "Reached streak milestone"
        }
        labels[activity_type] || activity_type.humanize
      end
    end
  end
end
