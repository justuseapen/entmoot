# frozen_string_literal: true

module Api
  module V1
    class TourPreferencesController < BaseController
      # GET /api/v1/users/me/tour_preferences
      def show
        render json: { tour_preferences: tour_preferences_response }, status: :ok
      end

      # POST /api/v1/users/me/tour_preferences/complete
      def complete
        current_user.update!(tour_completed_at: Time.current)
        render json: { tour_preferences: tour_preferences_response, message: "Tour completed" }, status: :ok
      end

      # POST /api/v1/users/me/tour_preferences/dismiss
      def dismiss
        current_user.update!(tour_dismissed_at: Time.current)
        render json: { tour_preferences: tour_preferences_response, message: "Tour dismissed" }, status: :ok
      end

      # POST /api/v1/users/me/tour_preferences/restart
      def restart
        current_user.update!(tour_completed_at: nil, tour_dismissed_at: nil)
        render json: { tour_preferences: tour_preferences_response, message: "Tour reset" }, status: :ok
      end

      private

      def tour_preferences_response
        {
          tour_completed_at: current_user.tour_completed_at,
          tour_dismissed_at: current_user.tour_dismissed_at,
          should_show_tour: should_show_tour?,
          can_restart_tour: current_user.tour_completed_at.present?
        }
      end

      def should_show_tour?
        # Show tour if:
        # 1. User hasn't completed the tour
        # 2. User hasn't dismissed it (or dismissed it more than 24 hours ago for "show me later")
        return false if current_user.tour_completed_at.present?
        return true if current_user.tour_dismissed_at.blank?

        # If dismissed more than 24 hours ago, show the prompt again
        current_user.tour_dismissed_at < 24.hours.ago
      end
    end
  end
end
