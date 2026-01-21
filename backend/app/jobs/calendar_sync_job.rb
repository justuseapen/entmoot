# frozen_string_literal: true

class CalendarSyncJob < ApplicationJob
  queue_as :default

  # Retry on quota errors with exponential backoff
  retry_on GoogleCalendarService::QuotaExceededError, wait: :polynomially_longer, attempts: 5

  # Discard on auth errors (user needs to reconnect)
  discard_on GoogleCalendarService::AuthenticationError do |job, error|
    user = User.find_by(id: job.arguments.first)
    user&.google_calendar_credential&.mark_error!(error.message)
    Rails.logger.error("Calendar sync auth error for user #{job.arguments.first}: #{error.message}")
  end

  def perform(user_id, syncable_type: nil, syncable_id: nil, full_sync: false)
    user = User.find_by(id: user_id)
    return unless user&.calendar_sync_enabled?

    sync_service = CalendarSyncService.new(user)

    if full_sync
      sync_service.full_sync
    elsif syncable_type && syncable_id
      syncable = syncable_type.constantize.find_by(id: syncable_id)
      return unless syncable

      case syncable
      when Goal
        sync_service.sync_goal(syncable)
      when WeeklyReview, MonthlyReview, QuarterlyReview, AnnualReview
        sync_service.sync_review(syncable)
      end
    end
  rescue CalendarSyncService::SyncError => e
    Rails.logger.error("Calendar sync error for user #{user_id}: #{e.message}")
    # Don't re-raise - the error has been logged
  end
end
