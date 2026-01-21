# frozen_string_literal: true

module Api
  module V1
    class GoogleCalendarController < ApplicationController
      before_action :authenticate_user!

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
        state = generate_oauth_state
        session[:google_oauth_state] = state

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
        validate_oauth_state!

        tokens = GoogleOAuthService.exchange_code(
          code: params[:code],
          redirect_uri: oauth_redirect_uri
        )

        # Store tokens temporarily in session for calendar selection
        session[:google_calendar_tokens] = {
          access_token: tokens[:access_token],
          refresh_token: tokens[:refresh_token],
          expires_at: tokens[:expires_at].iso8601
        }

        # Redirect to frontend calendar selection page
        redirect_to "#{frontend_url}/settings/calendar/select", allow_other_host: true
      rescue GoogleOAuthService::TokenExchangeError => e
        redirect_to "#{frontend_url}/settings/notifications?error=#{CGI.escape(e.message)}", allow_other_host: true
      rescue InvalidOAuthStateError => e
        redirect_to "#{frontend_url}/settings/notifications?error=#{CGI.escape(e.message)}", allow_other_host: true
      end

      # GET /users/me/google_calendar/calendars
      def calendars
        tokens = session[:google_calendar_tokens]
        return render json: { error: "No pending OAuth session" }, status: :bad_request unless tokens

        # Create temporary credential for listing calendars
        temp_credential = build_temp_credential(tokens)
        service = GoogleCalendarService.new(current_user)

        # Override the credential for this request
        calendars = service.list_calendars_with_credential(temp_credential)

        render json: { calendars: calendars }
      rescue GoogleCalendarService::AuthenticationError => e
        render json: { error: e.message }, status: :unauthorized
      end

      # POST /users/me/google_calendar/connect
      def connect
        tokens = session[:google_calendar_tokens]
        return render json: { error: "No pending OAuth session" }, status: :bad_request unless tokens

        calendar_id = params[:calendar_id]
        calendar_name = params[:calendar_name]
        google_email = params[:google_email]

        return render json: { error: "calendar_id is required" }, status: :bad_request if calendar_id.blank?

        # Create or update credential
        credential = current_user.google_calendar_credential || current_user.build_google_calendar_credential

        credential.assign_attributes(
          access_token: tokens["access_token"],
          refresh_token: tokens["refresh_token"],
          token_expires_at: Time.zone.parse(tokens["expires_at"]),
          calendar_id: calendar_id,
          calendar_name: calendar_name,
          google_email: google_email,
          sync_status: :active,
          last_error: nil
        )

        if credential.save
          # Clear session tokens
          session.delete(:google_calendar_tokens)
          session.delete(:google_oauth_state)

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

      def generate_oauth_state
        SecureRandom.urlsafe_base64(32)
      end

      def validate_oauth_state!
        received_state = params[:state]
        expected_state = session[:google_oauth_state]

        return unless received_state.blank? || expected_state.blank? || received_state != expected_state

        raise InvalidOAuthStateError, "Invalid OAuth state parameter"
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
          "https://app.entmoot.app"
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
          access_token: tokens["access_token"],
          refresh_token: tokens["refresh_token"],
          token_expires_at: Time.zone.parse(tokens["expires_at"])
        )
      end
    end
  end
end
