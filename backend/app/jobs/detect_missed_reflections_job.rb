# frozen_string_literal: true

# Job to detect users who have a daily plan but missed their evening reflection
# Runs at 21:00 and 22:00 per major timezone to catch users who haven't reflected by 10pm
class DetectMissedReflectionsJob < ApplicationJob
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

    Rails.logger.info("DetectMissedReflectionsJob: Starting missed reflection detection")

    candidates = ReengagementDetectionService.detect_missed_reflections
    return if candidates.empty?

    Rails.logger.info("DetectMissedReflectionsJob: Found #{candidates.size} users who missed reflection")

    results = OutreachService.send_to_candidates(candidates)

    Rails.logger.info(
      "DetectMissedReflectionsJob: Completed - " \
      "sent: #{results[:sent]}, skipped: #{results[:skipped]}, failed: #{results[:failed]}"
    )
  end

  private

  def enabled?
    ENV.fetch("REENGAGEMENT_JOBS_ENABLED", "true") == "true"
  end
end
