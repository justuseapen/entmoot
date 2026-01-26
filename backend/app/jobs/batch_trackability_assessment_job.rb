# frozen_string_literal: true

class BatchTrackabilityAssessmentJob < ApplicationJob
  queue_as :low

  BATCH_SIZE = 10
  DELAY_BETWEEN_BATCHES = 2.seconds

  # rubocop:disable Metrics/AbcSize, Metrics/MethodLength
  def perform(family_id:, user_id:, force_reassess: false)
    family = Family.find(family_id)
    user = User.find(user_id)

    goals = goals_to_assess(family, force_reassess)
    total_count = goals.count

    if total_count.zero?
      notify_no_goals(user)
      return
    end

    notify_started(user, total_count)

    # Schedule assessments with staggered delays to avoid rate limiting
    goals.find_each.with_index do |goal, index|
      delay = calculate_delay(index)
      GoalTrackabilityAssessmentJob.set(wait: delay).perform_later(goal.id)
    end

    log_success(family_id, total_count)
  rescue StandardError => e
    log_and_raise(e)
  end
  # rubocop:enable Metrics/AbcSize, Metrics/MethodLength

  private

  def goals_to_assess(family, force_reassess)
    scope = family.goals.where(is_draft: false)
    scope = scope.where(trackability_assessed_at: nil) unless force_reassess
    scope
  end

  def calculate_delay(index)
    batch_number = index / BATCH_SIZE
    batch_number * DELAY_BETWEEN_BATCHES
  end

  def notify_no_goals(user)
    NotificationService.create_and_broadcast(
      user: user,
      title: "Trackability Assessment",
      body: "All goals have already been assessed for trackability.",
      notification_type: :goal_update
    )
  end

  def notify_started(user, count)
    NotificationService.create_and_broadcast(
      user: user,
      title: "Trackability Assessment Started",
      body: "Assessing #{count} goal#{"s" if count != 1} for automatic tracking potential. You'll see updates shortly.",
      notification_type: :goal_update
    )
  end

  def log_success(family_id, count)
    Rails.logger.info("BatchTrackabilityAssessmentJob: Scheduled #{count} assessments for family #{family_id}")
  end

  def log_and_raise(error)
    Rails.logger.error("BatchTrackabilityAssessmentJob failed: #{error.message}")
    Rails.logger.error(error.backtrace.first(10).join("\n"))
    raise
  end
end
