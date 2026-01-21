# frozen_string_literal: true

class CalendarRemoveEventJob < ApplicationJob
  queue_as :default

  # Retry on quota errors with exponential backoff
  retry_on GoogleCalendarService::QuotaExceededError, wait: :polynomially_longer, attempts: 3

  # Discard on auth errors (nothing we can do)
  discard_on GoogleCalendarService::AuthenticationError

  def perform(user_id, google_event_id, google_calendar_id)
    user = User.find_by(id: user_id)
    return unless user&.calendar_sync_enabled?

    calendar_service = GoogleCalendarService.new(user)
    calendar_service.delete_event(
      calendar_id: google_calendar_id,
      event_id: google_event_id
    )

    Rails.logger.info("Removed calendar event #{google_event_id} for user #{user_id}")
  rescue GoogleCalendarService::EventNotFoundError
    # Event already deleted, that's fine
    Rails.logger.info("Calendar event #{google_event_id} already deleted")
  rescue GoogleCalendarService::Error => e
    Rails.logger.error("Failed to remove calendar event #{google_event_id}: #{e.message}")
    # Don't re-raise - best effort deletion
  end
end
