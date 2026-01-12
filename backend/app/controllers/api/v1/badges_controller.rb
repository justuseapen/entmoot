# frozen_string_literal: true

module Api
  module V1
    class BadgesController < Api::V1::BaseController
      # GET /api/v1/badges - List all available badges
      def index
        @badges = Badge.order(:category, :name)
        render json: { badges: @badges.map { |badge| badge_response(badge) } }, status: :ok
      end

      # GET /api/v1/users/me/badges - List user's badges with progress
      def user_badges
        # Check for any newly eligible badges
        BadgeService.check_all_badges(current_user)

        badges_with_status = BadgeService.badges_for_user(current_user)

        render json: {
          badges: badges_with_status.map { |badge_data| user_badge_response(badge_data) },
          stats: badge_stats
        }, status: :ok
      end

      private

      def badge_response(badge)
        {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          criteria: badge.criteria
        }
      end

      def user_badge_response(badge_data)
        badge = badge_data[:badge]
        {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          earned: badge_data[:earned],
          earned_at: badge_data[:earned_at]
        }
      end

      def badge_stats
        total = Badge.count
        earned = current_user.user_badges.count

        {
          total_badges: total,
          earned_badges: earned,
          completion_percentage: total.positive? ? ((earned.to_f / total) * 100).round : 0
        }
      end
    end
  end
end
