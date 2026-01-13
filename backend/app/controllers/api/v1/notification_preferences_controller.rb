# frozen_string_literal: true

module Api
  module V1
    class NotificationPreferencesController < Api::V1::BaseController
      PERMITTED_PARAMS = %i[
        in_app email push sms
        morning_planning evening_reflection weekly_review
        morning_planning_time evening_reflection_time weekly_review_time weekly_review_day
        monthly_review monthly_review_day quarterly_review annual_review
        quiet_hours_start quiet_hours_end
        tips_enabled
        reengagement_enabled missed_checkin_reminder inactivity_reminder inactivity_threshold_days
        check_in_frequency
      ].freeze

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
        params.require(:notification_preferences).permit(PERMITTED_PARAMS)
      end

      def preference_response(prefs)
        {
          id: prefs.id,
          channels: channel_preferences(prefs),
          reminders: reminder_preferences(prefs),
          quiet_hours: quiet_hours_preferences(prefs),
          tips: tips_preferences(prefs),
          reengagement: reengagement_preferences(prefs),
          check_in_frequency: prefs.check_in_frequency,
          created_at: prefs.created_at,
          updated_at: prefs.updated_at
        }
      end

      def channel_preferences(prefs)
        {
          in_app: prefs.in_app,
          email: prefs.email,
          push: prefs.push,
          sms: prefs.sms
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

      def reengagement_preferences(prefs)
        {
          enabled: prefs.reengagement_enabled,
          missed_checkin_reminder: prefs.missed_checkin_reminder,
          inactivity_reminder: prefs.inactivity_reminder,
          inactivity_threshold_days: prefs.inactivity_threshold_days
        }
      end
    end
  end
end
