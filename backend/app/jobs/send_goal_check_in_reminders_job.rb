# frozen_string_literal: true

class SendGoalCheckInRemindersJob < ApplicationJob
  queue_as :default

  def perform
    find_goals_needing_check_in.find_each do |goal|
      send_reminder_if_due(goal)
    end
  end

  private

  def find_goals_needing_check_in
    Goal.where(status: %i[not_started in_progress at_risk])
        .where(due_date: Time.current..7.days.from_now)
        .includes(:creator, :family)
  end

  def send_reminder_if_due(goal)
    context = build_context(goal)
    return unless context

    send_email(context) unless should_skip?(context)
  end

  def build_context(goal)
    user = goal.creator
    return nil unless user

    preference = user.notification_preference
    return nil unless preference&.email

    family = goal.family
    return nil unless family

    { user: user, preference: preference, family: family, goal: goal }
  end

  def should_skip?(context)
    # Skip if check-in frequency doesn't include daily reminders
    return true unless context[:preference].daily_reminders_enabled?

    timezone = context[:family].timezone || "UTC"
    current_time = Time.current.in_time_zone(timezone)

    context[:preference].within_quiet_hours?(current_time) ||
      goal_check_in_sent_today?(context[:user], context[:goal], current_time)
  end

  def send_email(context)
    ReminderMailer.goal_check_in(context[:user], context[:family], context[:goal]).deliver_later
  end

  def goal_check_in_sent_today?(user, goal, current_time)
    start_of_day = current_time.beginning_of_day
    Notification.where(user: user, notification_type: :goal_check_in)
                .where(created_at: start_of_day..)
                .exists?(["link LIKE ?", "%/goals/#{goal.id}%"])
  end
end
