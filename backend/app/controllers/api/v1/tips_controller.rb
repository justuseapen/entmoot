# frozen_string_literal: true

module Api
  module V1
    class TipsController < Api::V1::BaseController
      # GET /api/v1/users/me/tips
      def show
        @preferences = NotificationPreference.find_or_create_for(current_user)
        render json: { tips: tips_response(@preferences) }, status: :ok
      end

      # POST /api/v1/users/me/tips/mark_shown
      def mark_shown
        @preferences = NotificationPreference.find_or_create_for(current_user)
        tip_type = params[:tip_type]

        unless NotificationPreference::TIP_TYPES.include?(tip_type)
          return render_errors(["Invalid tip type: #{tip_type}"])
        end

        if @preferences.mark_tip_shown!(tip_type)
          render json: { tips: tips_response(@preferences) }, status: :ok
        else
          render json: { tips: tips_response(@preferences), already_shown: true }, status: :ok
        end
      end

      # PATCH /api/v1/users/me/tips/toggle
      def toggle
        @preferences = NotificationPreference.find_or_create_for(current_user)

        if @preferences.update(tips_enabled: params[:enabled])
          render json: { tips: tips_response(@preferences) }, status: :ok
        else
          render_errors(@preferences.errors.full_messages)
        end
      end

      private

      def tips_response(prefs)
        {
          tips_enabled: prefs.tips_enabled,
          shown_tips: prefs.shown_tips,
          available_tips: NotificationPreference::TIP_TYPES,
          pending_tips: NotificationPreference::TIP_TYPES - prefs.shown_tips
        }
      end
    end
  end
end
