# frozen_string_literal: true

module Api
  module V1
    class EmailSubscriptionsController < BaseController
      skip_before_action :authenticate_user!

      def unsubscribe
        payload = decode_token(params[:token])
        return render_invalid_token unless payload

        user = User.find_by(id: payload["user_id"])
        return render_user_not_found unless user

        # Support both "reminder_type" and "type" keys in token payload
        reminder_type = (payload["reminder_type"] || payload["type"])&.to_sym
        unsubscribe_from_reminder(user, reminder_type)

        render json: {
          message: "Successfully unsubscribed from #{reminder_type.to_s.humanize.downcase} emails"
        }
      end

      private

      def decode_token(token)
        JWT.decode(token, Rails.application.secret_key_base, true, algorithm: "HS256").first
      rescue JWT::DecodeError, JWT::ExpiredSignature
        nil
      end

      def render_invalid_token
        render json: { error: "Invalid or expired unsubscribe token" }, status: :bad_request
      end

      def render_user_not_found
        render json: { error: "User not found" }, status: :not_found
      end

      def unsubscribe_from_reminder(user, reminder_type)
        case reminder_type
        when :onboarding
          user.update!(onboarding_unsubscribed: true)
        else
          unsubscribe_from_regular_reminder(user, reminder_type)
        end
      end

      def unsubscribe_from_regular_reminder(user, reminder_type)
        preference = NotificationPreference.find_or_create_for(user)

        case reminder_type
        when :morning_planning
          preference.update!(morning_planning: false)
        when :evening_reflection
          preference.update!(evening_reflection: false)
        when :weekly_review
          preference.update!(weekly_review: false)
        when :goal_check_in
          preference.update!(email: false)
        end
      end
    end
  end
end
