# frozen_string_literal: true

# rubocop:disable Metrics/AbcSize, Metrics/MethodLength
class GoalImportJob < ApplicationJob
  queue_as :default

  def perform(job_id:, family_id:, user_id:, csv_content:, generate_sub_goals: false)
    family = Family.find(family_id)
    user = User.find(user_id)

    service = GoalImportService.new(family: family, user: user)
    results = service.import(
      csv_content: csv_content,
      generate_sub_goals: generate_sub_goals
    )

    Rails.cache.write(
      "goal_import:#{job_id}",
      format_results(results),
      expires_in: 1.hour
    )

    notify_user(user, family, results)
  rescue StandardError => e
    Rails.cache.write(
      "goal_import:#{job_id}",
      { error: e.message },
      expires_in: 1.hour
    )

    Rails.logger.error("GoalImportJob failed: #{e.message}")
    Rails.logger.error(e.backtrace.first(10).join("\n"))
  end

  private

  def format_results(results)
    {
      created_count: results[:created_count],
      failed_count: results[:failed_count],
      categories: results[:categories],
      goals: results[:goals],
      failures: results[:failures],
      sub_goal_suggestions: results[:sub_goal_suggestions]
    }
  end

  def notify_user(user, family, results)
    NotificationService.create_notification(
      user: user,
      family: family,
      notification_type: "goal_import_complete",
      message: "Goal import complete: #{results[:created_count]} created, #{results[:failed_count]} failed"
    )
  end
end
# rubocop:enable Metrics/AbcSize, Metrics/MethodLength
