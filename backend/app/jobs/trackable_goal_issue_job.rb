# frozen_string_literal: true

class TrackableGoalIssueJob < ApplicationJob
  queue_as :default

  def perform(goal_id)
    goal = Goal.find(goal_id)
    service = GitHubIssueService.new(goal)

    return unless service.configured?

    service.create_trackable_goal_issue
    log_success(goal_id)
  rescue GitHubIssueService::GitHubError => e
    log_github_error(goal_id, e)
  rescue StandardError => e
    log_and_raise(e)
  end

  private

  def log_success(goal_id)
    Rails.logger.info("GitHub issue created for trackable goal #{goal_id}")
  end

  def log_github_error(goal_id, error)
    Rails.logger.error("TrackableGoalIssueJob failed for goal #{goal_id}: #{error.message}")
  end

  def log_and_raise(error)
    Rails.logger.error("TrackableGoalIssueJob failed: #{error.message}")
    Rails.logger.error(error.backtrace.first(10).join("\n"))
    raise
  end
end
