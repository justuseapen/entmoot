# frozen_string_literal: true

module Api
  module V1
    class StreaksController < Api::V1::BaseController
      def index
        # Check and reset any broken streaks before returning
        StreakService.check_and_reset_broken_streaks(current_user)

        @streaks = StreakService.get_all_streaks(current_user)
        render json: { streaks: @streaks.map { |streak| streak_response(streak) } }, status: :ok
      end

      private

      def streak_response(streak)
        {
          id: streak.id,
          streak_type: streak.streak_type,
          current_count: streak.current_count,
          longest_count: streak.longest_count,
          last_activity_date: streak.last_activity_date,
          at_risk: streak_at_risk?(streak),
          next_milestone: next_milestone_for(streak),
          created_at: streak.created_at,
          updated_at: streak.updated_at
        }
      end

      def streak_at_risk?(streak)
        return false if streak.last_activity_date.nil?
        return false if streak.current_count.zero?

        today = Time.zone.today
        days_since = (today - streak.last_activity_date).to_i
        threshold = streak.weekly_review? ? 6 : 1

        days_since >= threshold
      end

      def next_milestone_for(streak)
        Streak::MILESTONE_THRESHOLDS.find { |m| m > streak.current_count }
      end
    end
  end
end
