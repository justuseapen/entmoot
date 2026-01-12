# frozen_string_literal: true

module Api
  module V1
    class NotificationPreferencesController < Api::V1::BaseController
      def show
        @preferences = NotificationPreference.find_or_create_for(current_user)
        render json: { notification_preferences: preference_response(@preferences) }, status: :ok
      end

      def update
        @preferences = NotificationPreference.find_or_create_for(current_user)

        if @preferences.update(notification_preference_params)
          render json: { notification_preferences: preference_response(@preferences) }, status: :ok
        else
          render_errors(@preferences.errors.full_messages)
        end
      end

      private

      def notification_preference_params
        params.require(:notification_preferences).permit(
          # Channel preferences
          :in_app,
          :email,
          :push,
          # Reminder preferences
          :morning_planning,
          :evening_reflection,
          :weekly_review,
          # Preferred times
          :morning_planning_time,
          :evening_reflection_time,
          :weekly_review_time,
          :weekly_review_day,
          # Quiet hours
          :quiet_hours_start,
          :quiet_hours_end,
          # Tips
          :tips_enabled
        )
      end

      def preference_response(prefs)
        {
          id: prefs.id,
          channels: channel_preferences(prefs),
          reminders: reminder_preferences(prefs),
          quiet_hours: quiet_hours_preferences(prefs),
          tips: tips_preferences(prefs),
          created_at: prefs.created_at,
          updated_at: prefs.updated_at
        }
      end

      def channel_preferences(prefs)
        {
          in_app: prefs.in_app,
          email: prefs.email,
          push: prefs.push
        }
      end

      def reminder_preferences(prefs)
        {
          morning_planning: {
            enabled: prefs.morning_planning,
            time: prefs.morning_planning_time
          },
          evening_reflection: {
            enabled: prefs.evening_reflection,
            time: prefs.evening_reflection_time
          },
          weekly_review: {
            enabled: prefs.weekly_review,
            time: prefs.weekly_review_time,
            day: prefs.weekly_review_day
          }
        }
      end

      def quiet_hours_preferences(prefs)
        {
          start: prefs.quiet_hours_start,
          end: prefs.quiet_hours_end
        }
      end

      def tips_preferences(prefs)
        {
          enabled: prefs.tips_enabled
        }
      end
    end
  end
end
