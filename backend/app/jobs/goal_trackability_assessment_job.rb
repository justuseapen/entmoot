# frozen_string_literal: true

class GoalTrackabilityAssessmentJob < ApplicationJob
  queue_as :default

  # Retry with exponential backoff for rate limiting
  retry_on AnthropicClient::RateLimitError, wait: :polynomially_longer, attempts: 5

  # rubocop:disable Metrics/MethodLength
  def perform(goal_id)
    goal = Goal.find_by(id: goal_id)
    return unless goal # Goal may have been deleted

    service = GoalTrackabilityService.new(goal)
    result = service.assess

    goal.update!(
      trackable: result[:is_trackable],
      trackability_assessment: {
        "reason" => result[:reason],
        "potential_integrations" => result[:potential_integrations],
        "assessed_version" => 1
      },
      trackability_assessed_at: Time.current
    )

    # NOTE: GitHub issue creation is handled by the Goal model callback
    # when trackable status changes from false to true

    log_success(goal_id, result[:is_trackable])
  rescue GoalTrackabilityService::AssessmentError => e
    log_assessment_error(goal_id, e)
    # Don't re-raise - we don't want to block goal creation
  rescue StandardError => e
    log_and_raise(e)
  end
  # rubocop:enable Metrics/MethodLength

  private

  def log_success(goal_id, is_trackable)
    Rails.logger.info("Trackability assessed for goal #{goal_id}: trackable=#{is_trackable}")
  end

  def log_assessment_error(goal_id, error)
    Rails.logger.error("GoalTrackabilityAssessmentJob failed for goal #{goal_id}: #{error.message}")
  end

  def log_and_raise(error)
    Rails.logger.error("GoalTrackabilityAssessmentJob failed: #{error.message}")
    Rails.logger.error(error.backtrace.first(10).join("\n"))
    raise
  end
end
