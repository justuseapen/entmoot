# frozen_string_literal: true

module Api
  module V1
    class PhoneNumbersController < Api::V1::BaseController
      # GET /api/v1/users/me/phone_number
      def show
        sms_service = SmsService.new
        render json: {
          phone_number: current_user.phone_number,
          phone_verified: current_user.phone_verified,
          sms_enabled: notification_sms_enabled?,
          sms_count_today: sms_service.sms_count_today(current_user),
          remaining_sms_quota: sms_service.remaining_sms_quota(current_user)
        }
      end

      # POST /api/v1/users/me/phone_number
      def create
        phone_number = phone_number_params[:phone_number]

        return handle_invalid_phone_format unless SmsService.valid_phone_number?(phone_number)
        return handle_phone_in_use if phone_already_in_use?(phone_number)

        update_phone_number(phone_number)
      end

      # DELETE /api/v1/users/me/phone_number
      def destroy
        return render_error("No phone number to remove", status: :not_found) if current_user.phone_number.blank?

        current_user.update(phone_number: nil, phone_verified: false)
        head :no_content
      end

      # POST /api/v1/users/me/phone_number/verify
      def verify
        return handle_dev_verification unless Rails.env.production?

        handle_production_verification
      end

      private

      def phone_number_params
        params.require(:phone_number).permit(:phone_number)
      end

      def notification_sms_enabled?
        prefs = current_user.notification_preference
        prefs&.sms || false
      end

      def phone_already_in_use?(phone_number)
        User.where(phone_number: phone_number).where.not(id: current_user.id).exists?
      end

      def handle_invalid_phone_format
        render_error(
          "Invalid phone number format. Must be E.164 format (e.g., +14155551234)",
          status: :unprocessable_content
        )
      end

      def handle_phone_in_use
        render_error("Phone number is already in use", status: :unprocessable_content)
      end

      def update_phone_number(phone_number)
        if current_user.update(phone_number: phone_number, phone_verified: false)
          # Auto-verify in development
          current_user.update(phone_verified: true) unless Rails.env.production?
          render_phone_success
        else
          render_errors(current_user.errors.full_messages)
        end
      end

      def render_phone_success
        msg = Rails.env.production? ? "Verification code sent" : "Phone number added (dev mode)"
        render json: {
          phone_number: current_user.phone_number,
          phone_verified: current_user.phone_verified,
          message: msg
        }, status: :ok
      end

      def handle_dev_verification
        current_user.update(phone_verified: true)
        render json: { phone_verified: true, message: "Phone number verified (development mode)" }
      end

      def handle_production_verification
        verification_code = params[:verification_code]
        return render_error("Verification code is required", status: :unprocessable_content) if verification_code.blank?

        # Placeholder for actual verification logic
        render_error("Phone verification not yet implemented for production", status: :not_implemented)
      end
    end
  end
end
