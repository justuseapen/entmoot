# frozen_string_literal: true

module Api
  module V1
    class GoogleCalendarController < ApplicationController
      before_action :authenticate_user!, except: [:callback]
      before_action :authenticate_user_from_state!, only: [:callback]

      # GET /users/me/google_calendar
      def show
        credential = current_user.google_calendar_credential

        if credential
          render json: {
            connected: true,
            calendar_id: credential.calendar_id,
            calendar_name: credential.calendar_name,
            google_email: credential.google_email,
            sync_status: credential.sync_status,
            last_sync_at: credential.last_sync_at,
            last_error: credential.last_error
          }
        else
          render json: { connected: false }
        end
      end

      # GET /users/me/google_calendar/auth_url
      def auth_url
        state = generate_signed_state(current_user.id)

        url = GoogleOAuthService.authorization_url(
          state: state,
          redirect_uri: oauth_redirect_uri
        )

        render json: { auth_url: url }
      rescue GoogleOAuthService::ConfigurationError => e
        render json: { error: e.message }, status: :service_unavailable
      end

      # GET /users/me/google_calendar/callback
      def callback
        # User is already authenticated via authenticate_user_from_state!

        tokens = GoogleOAuthService.exchange_code(
          code: params[:code],
          redirect_uri: oauth_redirect_uri
        )

        # Encrypt tokens to pass via URL (short-lived, for calendar selection)
        encrypted_tokens = encrypt_tokens(tokens)

        # Redirect to frontend calendar selection page with encrypted tokens
        redirect_to "#{frontend_url}/settings/calendar/select?tokens=#{CGI.escape(encrypted_tokens)}",
                    allow_other_host: true
      rescue GoogleOAuthService::TokenExchangeError => e
        redirect_to "#{frontend_url}/settings/notifications?error=#{CGI.escape(e.message)}", allow_other_host: true
      rescue InvalidOAuthStateError => e
        redirect_to "#{frontend_url}/settings/notifications?error=#{CGI.escape(e.message)}", allow_other_host: true
      end

      # GET /users/me/google_calendar/calendars
      def calendars
        encrypted_tokens = params[:tokens]
        return render json: { error: "No OAuth tokens provided" }, status: :bad_request if encrypted_tokens.blank?

        tokens = decrypt_tokens(encrypted_tokens)
        return render json: { error: "Invalid or expired tokens" }, status: :bad_request unless tokens

        # Create temporary credential for listing calendars
        temp_credential = build_temp_credential(tokens)
        service = GoogleCalendarService.new(current_user)

        # Override the credential for this request
        calendars = service.list_calendars_with_credential(temp_credential)

        render json: { calendars: calendars }
      rescue GoogleCalendarService::AuthenticationError => e
        render json: { error: e.message }, status: :unauthorized
      rescue ActiveSupport::MessageEncryptor::InvalidMessage
        render json: { error: "Invalid or expired tokens" }, status: :bad_request
      end

      # POST /users/me/google_calendar/connect
      def connect
        encrypted_tokens = params[:tokens]
        return render json: { error: "No OAuth tokens provided" }, status: :bad_request if encrypted_tokens.blank?

        tokens = decrypt_tokens(encrypted_tokens)
        return render json: { error: "Invalid or expired tokens" }, status: :bad_request unless tokens

        calendar_id = params[:calendar_id]
        calendar_name = params[:calendar_name]
        google_email = params[:google_email]

        return render json: { error: "calendar_id is required" }, status: :bad_request if calendar_id.blank?

        # Create or update credential
        credential = current_user.google_calendar_credential || current_user.build_google_calendar_credential

        credential.assign_attributes(
          access_token: tokens[:access_token],
          refresh_token: tokens[:refresh_token],
          token_expires_at: tokens[:expires_at],
          calendar_id: calendar_id,
          calendar_name: calendar_name,
          google_email: google_email,
          sync_status: :active,
          last_error: nil
        )

        if credential.save
          # Trigger initial sync
          CalendarInitialSyncJob.perform_later(current_user.id)

          render json: {
            connected: true,
            calendar_id: credential.calendar_id,
            calendar_name: credential.calendar_name,
            google_email: credential.google_email,
            sync_status: credential.sync_status
          }, status: :created
        else
          render json: { errors: credential.errors.full_messages }, status: :unprocessable_content
        end
      rescue ActiveSupport::MessageEncryptor::InvalidMessage
        render json: { error: "Invalid or expired tokens" }, status: :bad_request
      end

      # DELETE /users/me/google_calendar
      def destroy
        credential = current_user.google_calendar_credential

        if credential
          # Delete all sync mappings and the credential
          current_user.calendar_sync_mappings.destroy_all
          credential.destroy

          render json: { disconnected: true }
        else
          render json: { error: "No Google Calendar connection found" }, status: :not_found
        end
      end

      # POST /users/me/google_calendar/sync
      def sync
        credential = current_user.google_calendar_credential

        unless credential&.active?
          return render json: { error: "Google Calendar is not connected or is in error state" }, status: :bad_request
        end

        CalendarSyncJob.perform_later(current_user.id, full_sync: true)

        render json: { message: "Sync started", sync_status: "syncing" }
      end

      # POST /users/me/google_calendar/pause
      def pause
        credential = current_user.google_calendar_credential
        return render json: { error: "No Google Calendar connection found" }, status: :not_found unless credential

        credential.update!(sync_status: :paused)
        render json: { sync_status: credential.sync_status }
      end

      # POST /users/me/google_calendar/resume
      def resume
        credential = current_user.google_calendar_credential
        return render json: { error: "No Google Calendar connection found" }, status: :not_found unless credential

        credential.update!(sync_status: :active, last_error: nil)

        # Trigger a sync after resuming
        CalendarSyncJob.perform_later(current_user.id, full_sync: true)

        render json: { sync_status: credential.sync_status }
      end

      private

      class InvalidOAuthStateError < StandardError; end

      # State token expiry (10 minutes should be plenty for OAuth flow)
      STATE_EXPIRY = 10.minutes
      # Token expiry for encrypted tokens passed to frontend (5 minutes)
      TOKEN_EXPIRY = 5.minutes

      def generate_signed_state(user_id)
        payload = {
          user_id: user_id,
          nonce: SecureRandom.urlsafe_base64(16),
          exp: STATE_EXPIRY.from_now.to_i
        }
        message_encryptor.encrypt_and_sign(payload.to_json)
      end

      def verify_signed_state(state)
        return nil if state.blank?

        payload = JSON.parse(message_encryptor.decrypt_and_verify(state))
        return nil if payload["exp"] < Time.current.to_i

        payload
      rescue ActiveSupport::MessageEncryptor::InvalidMessage, JSON::ParserError
        nil
      end

      def authenticate_user_from_state!
        payload = verify_signed_state(params[:state])
        raise InvalidOAuthStateError, "Invalid OAuth state parameter" unless payload

        @current_user = User.find(payload["user_id"])
      rescue ActiveRecord::RecordNotFound
        raise InvalidOAuthStateError, "Invalid OAuth state parameter"
      end

      def encrypt_tokens(tokens)
        payload = {
          access_token: tokens[:access_token],
          refresh_token: tokens[:refresh_token],
          expires_at: tokens[:expires_at].iso8601,
          exp: TOKEN_EXPIRY.from_now.to_i
        }
        message_encryptor.encrypt_and_sign(payload.to_json)
      end

      def decrypt_tokens(encrypted)
        return nil if encrypted.blank?

        payload = JSON.parse(message_encryptor.decrypt_and_verify(encrypted))
        return nil if payload["exp"] < Time.current.to_i

        {
          access_token: payload["access_token"],
          refresh_token: payload["refresh_token"],
          expires_at: Time.zone.parse(payload["expires_at"])
        }
      rescue ActiveSupport::MessageEncryptor::InvalidMessage, JSON::ParserError
        nil
      end

      def message_encryptor
        @message_encryptor ||= ActiveSupport::MessageEncryptor.new(
          Rails.application.secret_key_base[0..31]
        )
      end

      def oauth_redirect_uri
        "#{api_host}/api/v1/users/me/google_calendar/callback"
      end

      def api_host
        if Rails.env.production?
          "https://api.entmoot.app"
        else
          "http://localhost:3000"
        end
      end

      def frontend_url
        if Rails.env.production?
          "https://entmoot.app"
        else
          "http://localhost:5173"
        end
      end

      TempCredential = Struct.new(:access_token, :refresh_token, :token_expires_at, keyword_init: true) do
        def token_expired?
          token_expires_at < Time.current
        end

        def token_expiring_soon?
          token_expires_at < 5.minutes.from_now
        end
      end

      def build_temp_credential(tokens)
        TempCredential.new(
          access_token: tokens[:access_token],
          refresh_token: tokens[:refresh_token],
          token_expires_at: tokens[:expires_at]
        )
      end
    end
  end
end
