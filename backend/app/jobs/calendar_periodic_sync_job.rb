# frozen_string_literal: true

class CalendarPeriodicSyncJob < ApplicationJob
  queue_as :low

  def perform
    Rails.logger.info("Starting periodic calendar sync for all active credentials")

    synced_count = 0
    error_count = 0

    GoogleCalendarCredential.active_and_valid.find_each do |credential|
      CalendarSyncJob.perform_later(credential.user_id, full_sync: true)
      synced_count += 1
    rescue StandardError => e
      error_count += 1
      Rails.logger.error("Failed to enqueue sync for credential #{credential.id}: #{e.message}")
    end

    Rails.logger.info("Enqueued #{synced_count} calendar syncs (#{error_count} errors)")
  end
end
