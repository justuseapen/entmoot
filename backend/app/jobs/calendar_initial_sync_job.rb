# frozen_string_literal: true

class CalendarInitialSyncJob < ApplicationJob
  queue_as :default

  # Retry on quota errors with exponential backoff
  retry_on GoogleCalendarService::QuotaExceededError, wait: :polynomially_longer, attempts: 5

  # Discard on auth errors (user needs to reconnect)
  discard_on GoogleCalendarService::AuthenticationError do |job, error|
    user = User.find_by(id: job.arguments.first)
    user&.google_calendar_credential&.mark_error!(error.message)
    Rails.logger.error("Calendar initial sync auth error for user #{job.arguments.first}: #{error.message}")
  end

  def perform(user_id)
    user = User.find_by(id: user_id)
    return unless user&.calendar_sync_enabled?

    Rails.logger.info("Starting initial calendar sync for user #{user_id}")

    sync_service = CalendarSyncService.new(user)
    sync_service.full_sync

    Rails.logger.info("Completed initial calendar sync for user #{user_id}")
  rescue CalendarSyncService::SyncError => e
    Rails.logger.error("Initial calendar sync error for user #{user_id}: #{e.message}")
    # The credential has already been marked with error in CalendarSyncService
  end
end
