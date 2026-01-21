# frozen_string_literal: true

require "google/apis/calendar_v3"

class GoogleCalendarService
  class Error < StandardError; end
  class AuthenticationError < Error; end
  class TokenExpiredError < AuthenticationError; end
  class CalendarNotFoundError < Error; end
  class EventNotFoundError < Error; end
  class QuotaExceededError < Error; end

  def initialize(user, credential: nil)
    @user = user
    @credential = credential || user.google_calendar_credential
    raise AuthenticationError, "User has no Google Calendar credentials" unless @credential
  end

  # List calendars with a temporary credential (used during OAuth flow)
  def list_calendars_with_credential(temp_credential)
    client = Google::Apis::CalendarV3::CalendarService.new
    client.authorization = build_authorization_for(temp_credential)

    result = client.list_calendar_lists
    result.items.map do |calendar|
      {
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        primary: calendar.primary || false,
        access_role: calendar.access_role
      }
    end
  rescue Google::Apis::AuthorizationError => e
    raise AuthenticationError, "Google Calendar authentication failed: #{e.message}"
  rescue Google::Apis::RateLimitError => e
    raise QuotaExceededError, "Google Calendar API quota exceeded: #{e.message}"
  end

  def list_calendars
    ensure_valid_token!

    result = api_client.list_calendar_lists
    result.items.map do |calendar|
      {
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        primary: calendar.primary || false,
        access_role: calendar.access_role
      }
    end
  rescue Google::Apis::AuthorizationError => e
    handle_auth_error(e)
  rescue Google::Apis::RateLimitError => e
    raise QuotaExceededError, "Google Calendar API quota exceeded: #{e.message}"
  end

  def create_event(calendar_id:, event_data:)
    ensure_valid_token!

    event = build_event(event_data)
    result = api_client.insert_event(calendar_id, event)

    {
      id: result.id,
      etag: result.etag,
      html_link: result.html_link
    }
  rescue Google::Apis::AuthorizationError => e
    handle_auth_error(e)
  rescue Google::Apis::RateLimitError => e
    raise QuotaExceededError, "Google Calendar API quota exceeded: #{e.message}"
  end

  def update_event(calendar_id:, event_id:, event_data:, etag: nil)
    ensure_valid_token!

    event = build_event(event_data)
    options = {}
    if etag.present?
      request_options = Google::Apis::RequestOptions.new
      request_options.header = { "If-Match" => etag }
      options[:options] = request_options
    end

    result = api_client.update_event(calendar_id, event_id, event, **options)

    {
      id: result.id,
      etag: result.etag,
      html_link: result.html_link
    }
  rescue Google::Apis::ClientError => e
    raise EventNotFoundError, "Event not found: #{event_id}" if e.status_code == 404

    raise
  rescue Google::Apis::AuthorizationError => e
    handle_auth_error(e)
  rescue Google::Apis::RateLimitError => e
    raise QuotaExceededError, "Google Calendar API quota exceeded: #{e.message}"
  end

  def delete_event(calendar_id:, event_id:)
    ensure_valid_token!

    api_client.delete_event(calendar_id, event_id)
    true
  rescue Google::Apis::ClientError => e
    return true if e.status_code == 404 # Already deleted

    raise
  rescue Google::Apis::AuthorizationError => e
    handle_auth_error(e)
  rescue Google::Apis::RateLimitError => e
    raise QuotaExceededError, "Google Calendar API quota exceeded: #{e.message}"
  end

  def get_event(calendar_id:, event_id:)
    ensure_valid_token!

    result = api_client.get_event(calendar_id, event_id)

    {
      id: result.id,
      summary: result.summary,
      description: result.description,
      start: result.start,
      end: result.end_,
      etag: result.etag
    }
  rescue Google::Apis::ClientError => e
    raise EventNotFoundError, "Event not found: #{event_id}" if e.status_code == 404

    raise
  rescue Google::Apis::AuthorizationError => e
    handle_auth_error(e)
  end

  private

  def ensure_valid_token!
    refresh_token_if_needed!
    raise TokenExpiredError, "Google Calendar token has expired" if @credential.token_expired?
  end

  def refresh_token_if_needed!
    return unless @credential.token_expiring_soon?

    tokens = GoogleOAuthService.refresh_access_token(refresh_token: @credential.refresh_token)

    @credential.update!(
      access_token: tokens[:access_token],
      token_expires_at: tokens[:expires_at],
      refresh_token: tokens[:refresh_token] || @credential.refresh_token
    )
  rescue GoogleOAuthService::TokenExchangeError => e
    @credential.mark_error!("Token refresh failed: #{e.message}")
    raise TokenExpiredError, "Failed to refresh token: #{e.message}"
  end

  def api_client
    @api_client ||= begin
      client = Google::Apis::CalendarV3::CalendarService.new
      client.authorization = build_authorization
      client
    end
  end

  def build_authorization
    build_authorization_for(@credential)
  end

  def build_authorization_for(cred)
    Google::Auth::UserRefreshCredentials.new(
      client_id: google_credentials[:client_id],
      client_secret: google_credentials[:client_secret],
      scope: GoogleOAuthService::SCOPE,
      access_token: cred.access_token,
      refresh_token: cred.refresh_token,
      expires_at: cred.token_expires_at
    )
  end

  def google_credentials
    {
      client_id: Rails.application.credentials.dig(:google, :client_id) || ENV.fetch("GOOGLE_CLIENT_ID", nil),
      client_secret: Rails.application.credentials.dig(:google,
                                                       :client_secret) || ENV.fetch("GOOGLE_CLIENT_SECRET", nil)
    }
  end

  def build_event(event_data)
    Google::Apis::CalendarV3::Event.new(
      summary: event_data[:summary],
      description: event_data[:description],
      start: build_event_time(event_data[:start]),
      end: build_event_time(event_data[:end] || event_data[:start]),
      reminders: Google::Apis::CalendarV3::Event::Reminders.new(use_default: false)
    )
  end

  def build_event_time(time_data)
    if time_data[:date]
      # All-day event
      Google::Apis::CalendarV3::EventDateTime.new(date: time_data[:date])
    else
      # Timed event
      Google::Apis::CalendarV3::EventDateTime.new(
        date_time: time_data[:date_time],
        time_zone: time_data[:time_zone]
      )
    end
  end

  def handle_auth_error(error)
    @credential.mark_error!("Authentication failed: #{error.message}")
    raise AuthenticationError, "Google Calendar authentication failed: #{error.message}"
  end
end
