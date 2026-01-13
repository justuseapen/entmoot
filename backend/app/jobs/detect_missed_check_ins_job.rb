# frozen_string_literal: true

# Job to detect users who missed their morning check-in and trigger re-engagement outreach
# Runs at 12:00 and 14:00 per major timezone to catch users who haven't planned by noon
class DetectMissedCheckInsJob < ApplicationJob
  queue_as :default

  # Major timezones to check, covering major population centers
  TIMEZONES = %w[
    America/Los_Angeles
    America/Denver
    America/Chicago
    America/New_York
    Europe/London
    Europe/Paris
    Asia/Tokyo
    Asia/Shanghai
    Australia/Sydney
  ].freeze

  def perform
    return unless enabled?

    Rails.logger.info("DetectMissedCheckInsJob: Starting missed check-in detection")

    candidates = ReengagementDetectionService.detect_missed_checkins
    return if candidates.empty?

    Rails.logger.info("DetectMissedCheckInsJob: Found #{candidates.size} users who missed check-in")

    results = OutreachService.send_to_candidates(candidates)

    Rails.logger.info(
      "DetectMissedCheckInsJob: Completed - " \
      "sent: #{results[:sent]}, skipped: #{results[:skipped]}, failed: #{results[:failed]}"
    )
  end

  private

  def enabled?
    ENV.fetch("REENGAGEMENT_JOBS_ENABLED", "true") == "true"
  end
end
