# frozen_string_literal: true

# Job to detect users who haven't had any API activity for configurable day thresholds
# Runs daily at 10:00 UTC to find and reach out to inactive users
class DetectInactiveUsersJob < ApplicationJob
  queue_as :default

  # Default inactivity thresholds in days
  DEFAULT_THRESHOLDS = [3, 7, 14, 30].freeze

  def perform(thresholds: nil)
    return unless enabled?

    thresholds ||= parse_thresholds_from_env

    Rails.logger.info("DetectInactiveUsersJob: Starting inactive user detection with thresholds: #{thresholds}")

    candidates = ReengagementDetectionService.detect_inactive_users(thresholds: thresholds)
    return if candidates.empty?

    Rails.logger.info("DetectInactiveUsersJob: Found #{candidates.size} inactive users")

    results = OutreachService.send_to_candidates(candidates)

    Rails.logger.info(
      "DetectInactiveUsersJob: Completed - " \
      "sent: #{results[:sent]}, skipped: #{results[:skipped]}, failed: #{results[:failed]}"
    )
  end

  private

  def enabled?
    ENV.fetch("REENGAGEMENT_JOBS_ENABLED", "true") == "true"
  end

  def parse_thresholds_from_env
    env_thresholds = ENV.fetch("INACTIVITY_THRESHOLDS", nil)
    return DEFAULT_THRESHOLDS if env_thresholds.blank?

    env_thresholds.split(",").map(&:strip).map(&:to_i).select(&:positive?)
  rescue StandardError
    DEFAULT_THRESHOLDS
  end
end
