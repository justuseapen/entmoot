# frozen_string_literal: true

module Api
  module V1
    class FirstGoalPromptsController < BaseController
      DISMISS_DURATION = 24.hours
      SESSION_TIMEOUT = 30.minutes
      GOAL_SUGGESTIONS = [
        {
          title: "Have dinner together 3 times this week",
          description: "Set aside dedicated family meal times to connect and share your day.",
          time_scale: "weekly"
        }.freeze,
        {
          title: "Exercise as a family once this week",
          description: "Plan a fun physical activity everyone can enjoy - a walk, bike ride, or backyard game.",
          time_scale: "weekly"
        }.freeze,
        {
          title: "Complete a home project together",
          description: "Choose a small project around the house that everyone can contribute to.",
          time_scale: "monthly"
        }.freeze,
        {
          title: "Start a new bedtime routine",
          description: "Create a consistent evening routine that helps everyone wind down and connect.",
          time_scale: "weekly"
        }.freeze
      ].freeze

      def show
        render json: {
          should_show: should_show_prompt?,
          first_goal_created_at: current_user.first_goal_created_at,
          dismissed_at: current_user.first_goal_prompt_dismissed_at,
          suggestions: GOAL_SUGGESTIONS
        }
      end

      def dismiss
        current_user.update!(first_goal_prompt_dismissed_at: Time.current)
        render json: { dismissed: true }
      end

      def suggestions
        render json: { suggestions: GOAL_SUGGESTIONS }
      end

      private

      def should_show_prompt?
        return false if current_user.first_goal_created_at.present?
        return false if recently_dismissed?
        return false unless within_first_session?

        true
      end

      def recently_dismissed?
        return false if current_user.first_goal_prompt_dismissed_at.blank?

        current_user.first_goal_prompt_dismissed_at > DISMISS_DURATION.ago
      end

      def within_first_session?
        current_user.created_at > SESSION_TIMEOUT.ago
      end
    end
  end
end
