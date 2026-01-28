# frozen_string_literal: true

class GoogleOAuthService
  AUTHORIZATION_URI = "https://accounts.google.com/o/oauth2/auth"
  TOKEN_URI = "https://oauth2.googleapis.com/token"
  SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly"
  ].freeze
  SCOPE = SCOPES.join(" ")

  class Error < StandardError; end
  class ConfigurationError < Error; end
  class TokenExchangeError < Error; end

  class << self
    def authorization_url(state:, redirect_uri:)
      validate_configuration!

      params = {
        client_id: credentials[:client_id],
        redirect_uri: redirect_uri,
        response_type: "code",
        scope: SCOPE,
        access_type: "offline",
        prompt: "consent",
        state: state
      }

      "#{AUTHORIZATION_URI}?#{params.to_query}"
    end

    def exchange_code(code:, redirect_uri:)
      validate_configuration!

      response = Faraday.post(TOKEN_URI) do |req|
        req.headers["Content-Type"] = "application/x-www-form-urlencoded"
        req.body = {
          code: code,
          client_id: credentials[:client_id],
          client_secret: credentials[:client_secret],
          redirect_uri: redirect_uri,
          grant_type: "authorization_code"
        }
      end

      handle_token_response(response)
    end

    def refresh_access_token(refresh_token:)
      validate_configuration!

      response = Faraday.post(TOKEN_URI) do |req|
        req.headers["Content-Type"] = "application/x-www-form-urlencoded"
        req.body = {
          refresh_token: refresh_token,
          client_id: credentials[:client_id],
          client_secret: credentials[:client_secret],
          grant_type: "refresh_token"
        }
      end

      handle_token_response(response)
    end

    private

    def credentials
      @credentials ||= {
        client_id: Rails.application.credentials.dig(:google, :client_id) || ENV.fetch("GOOGLE_CLIENT_ID", nil),
        client_secret: Rails.application.credentials.dig(:google,
                                                         :client_secret) || ENV.fetch("GOOGLE_CLIENT_SECRET", nil)
      }
    end

    def validate_configuration!
      raise ConfigurationError, "Google OAuth client_id is not configured" if credentials[:client_id].blank?
      raise ConfigurationError, "Google OAuth client_secret is not configured" if credentials[:client_secret].blank?
    end

    def handle_token_response(response)
      data = JSON.parse(response.body)

      if response.success?
        {
          access_token: data["access_token"],
          refresh_token: data["refresh_token"],
          expires_at: Time.current + data["expires_in"].to_i.seconds,
          token_type: data["token_type"],
          scope: data["scope"]
        }
      else
        error_message = data["error_description"] || data["error"] || "Token exchange failed"
        raise TokenExchangeError, error_message
      end
    end
  end
end
