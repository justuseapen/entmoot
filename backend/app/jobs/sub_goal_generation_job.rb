# frozen_string_literal: true

class SubGoalGenerationJob < ApplicationJob
  queue_as :default

  def perform(goal_id:, user_id:)
    goal = Goal.find(goal_id)
    user = User.find(user_id)

    service = SubGoalGenerationService.new(goal)
    result = service.generate

    create_draft_sub_goals(goal, result[:sub_goals], user)
    notify_user(user, goal, result[:sub_goals].count)
  rescue SubGoalGenerationService::GenerationError => e
    notify_user_of_failure(user, goal, e.message)
    Rails.logger.error("SubGoalGenerationJob failed for goal #{goal_id}: #{e.message}")
  rescue StandardError => e
    Rails.logger.error("SubGoalGenerationJob failed: #{e.message}")
    Rails.logger.error(e.backtrace.first(10).join("\n"))
    raise
  end

  private

  def create_draft_sub_goals(parent, sub_goals_data, user)
    sub_goals_data.each do |sg_data|
      Goal.create!(
        family: parent.family,
        creator: user,
        parent: parent,
        title: sg_data[:title],
        description: sg_data[:description],
        time_scale: sg_data[:time_scale],
        due_date: sg_data[:due_date],
        specific: sg_data.dig(:smart_fields, :specific),
        measurable: sg_data.dig(:smart_fields, :measurable),
        achievable: sg_data.dig(:smart_fields, :achievable),
        relevant: sg_data.dig(:smart_fields, :relevant),
        time_bound: sg_data.dig(:smart_fields, :time_bound),
        is_draft: true,
        status: :not_started,
        visibility: parent.visibility,
        progress: 0
      )
    end
  end

  def notify_user(user, goal, count)
    NotificationService.create_and_broadcast(
      user: user,
      title: "Sub-goals generated!",
      body: "#{count} sub-goals created for '#{goal.title}'. Review and customize them.",
      link: "/families/#{goal.family_id}/goals/#{goal.id}",
      notification_type: :goal_update
    )
  end

  def notify_user_of_failure(user, goal, error_message)
    NotificationService.create_and_broadcast(
      user: user,
      title: "Sub-goal generation failed",
      body: "Could not generate sub-goals for '#{goal.title}': #{error_message}",
      link: "/families/#{goal.family_id}/goals/#{goal.id}",
      notification_type: :goal_update
    )
  end
end
