# frozen_string_literal: true

module Api
  module V1
    class WebhooksController < ApplicationController
      skip_before_action :verify_authenticity_token, raise: false

      OPT_OUT_COMMANDS = %w[STOP UNSUBSCRIBE CANCEL END QUIT].freeze
      OPT_IN_COMMANDS = %w[START YES UNSTOP].freeze

      # POST /api/v1/webhooks/twilio
      # Handle incoming SMS messages (opt-out, etc.)
      def twilio
        return head :unauthorized if production_with_invalid_signature?

        process_sms_command
        render_empty_twiml
      end

      private

      def production_with_invalid_signature?
        Rails.env.production? && !valid_twilio_signature?
      end

      def process_sms_command
        from_number = params[:From]
        body = params[:Body]&.strip&.upcase

        Rails.logger.info("WebhooksController: Received SMS from #{from_number}: #{params[:Body]}")

        if OPT_OUT_COMMANDS.include?(body)
          handle_opt_out(from_number)
        elsif OPT_IN_COMMANDS.include?(body)
          handle_opt_in(from_number)
        else
          Rails.logger.info("WebhooksController: Non-command SMS received from #{from_number}")
        end
      end

      def render_empty_twiml
        render xml: "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>",
               content_type: "application/xml"
      end

      def handle_opt_out(phone_number)
        user = User.find_by(phone_number: phone_number)
        return unless user

        prefs = user.notification_preference
        return unless prefs

        prefs.update(sms: false)
        Rails.logger.info("WebhooksController: User #{user.id} opted out of SMS")
      end

      def handle_opt_in(phone_number)
        user = User.find_by(phone_number: phone_number)
        return unless user

        prefs = user.notification_preference
        return unless prefs

        prefs.update(sms: true)
        Rails.logger.info("WebhooksController: User #{user.id} opted back in to SMS")
      end

      def valid_twilio_signature?
        auth_token = Rails.application.credentials.dig(:twilio, :auth_token)
        return false if auth_token.blank?

        validator = Twilio::Security::RequestValidator.new(auth_token)
        url = request.original_url
        twilio_signature = request.headers["X-Twilio-Signature"]

        validator.validate(url, request.request_parameters, twilio_signature)
      end
    end
  end
end
