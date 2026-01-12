# frozen_string_literal: true

module Api
  module V1
    class FirstReflectionPromptsController < BaseController
      # Time ranges for prompts (in family's timezone)
      MORNING_START = 5
      MORNING_END = 12
      AFTERNOON_START = 12
      AFTERNOON_END = 17
      EVENING_START = 17
      EVENING_END = 22
      # 22:00 - 05:00 is "night" - no prompt shown

      PROMPTS = {
        morning: {
          question: "What's your top priority for today?",
          placeholder: "I want to focus on..."
        }.freeze,
        afternoon: {
          question: "What's one thing you want to accomplish before the day ends?",
          placeholder: "Before today ends, I want to..."
        }.freeze,
        evening: {
          question: "What's one thing that went well today?",
          placeholder: "Today I'm glad that..."
        }.freeze
      }.freeze

      def show
        render json: {
          should_show: should_show_prompt?,
          first_reflection_created_at: current_user.first_reflection_created_at,
          dismissed_at: current_user.first_reflection_prompt_dismissed_at,
          time_period: current_time_period,
          prompt: prompt_for_time_period
        }
      end

      def dismiss
        current_user.update!(first_reflection_prompt_dismissed_at: Time.current)
        render json: { dismissed: true }
      end

      def create
        family = find_family
        return render_no_family_error unless family

        reflection = create_quick_reflection(family)

        if reflection.persisted?
          track_first_reflection
          render json: reflection_response(reflection), status: :created
        else
          render json: { errors: reflection.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def should_show_prompt?
        return false if current_user.first_reflection_created_at.present?
        return false if recently_dismissed?
        return false if night_time?
        return false unless first_login?

        true
      end

      def recently_dismissed?
        return false if current_user.first_reflection_prompt_dismissed_at.blank?

        # Session-based dismiss - only for current session
        current_user.first_reflection_prompt_dismissed_at > session_start_time
      end

      def first_login?
        # First login check: user has no prior reflections
        current_user.first_reflection_created_at.blank?
      end

      def night_time?
        current_time_period.nil?
      end

      def current_time_period
        hour = current_hour_in_timezone
        return :morning if hour >= MORNING_START && hour < MORNING_END
        return :afternoon if hour >= AFTERNOON_START && hour < AFTERNOON_END
        return :evening if hour >= EVENING_START && hour < EVENING_END

        nil # Night time (22:00 - 05:00)
      end

      def prompt_for_time_period
        period = current_time_period
        return nil if period.nil?

        PROMPTS[period]
      end

      def current_hour_in_timezone
        timezone = family_timezone || "UTC"
        Time.find_zone(timezone)&.now&.hour || Time.current.hour
      end

      def family_timezone
        current_user.families.first&.timezone
      end

      def session_start_time
        # Session is considered "current" if dismissed within last hour
        1.hour.ago
      end

      def find_family
        if params[:family_id].present?
          current_user.families.find_by(id: params[:family_id])
        else
          current_user.families.first
        end
      end

      def render_no_family_error
        render json: { error: "User must belong to a family" }, status: :unprocessable_content
      end

      def create_quick_reflection(family)
        Reflection.create(
          user: current_user,
          family: family,
          reflection_type: :quick,
          reflection_responses_attributes: [
            {
              prompt: prompt_for_time_period&.dig(:question) || "Quick reflection",
              response: params[:response]
            }
          ]
        )
      end

      def track_first_reflection
        return if current_user.first_reflection_created_at.present?

        current_user.update!(first_reflection_created_at: Time.current)
      end

      def reflection_response(reflection)
        {
          id: reflection.id,
          reflection_type: reflection.reflection_type,
          created_at: reflection.created_at,
          response: reflection.reflection_responses.first&.response,
          prompt: reflection.reflection_responses.first&.prompt
        }
      end
    end
  end
end
