# frozen_string_literal: true

class SendMorningPlanningRemindersJob < ApplicationJob
  queue_as :default

  def perform
    User.joins(:notification_preference)
        .where(notification_preferences: { email: true, morning_planning: true })
        .find_each do |user|
          send_reminder_if_due(user)
    end
  end

  private

  def send_reminder_if_due(user)
    preference = user.notification_preference
    family = user.families.first
    return unless family

    timezone = family.timezone || "UTC"
    current_time = Time.current.in_time_zone(timezone)

    # Check if now is the scheduled time (within 5 minute window)
    scheduled_time = parse_time(preference.morning_planning_time, timezone, current_time)
    return unless within_window?(current_time, scheduled_time)

    # Check quiet hours
    return if preference.within_quiet_hours?(current_time)

    # Send the email
    ReminderMailer.morning_planning(user, family).deliver_later
  end

  def parse_time(time_string, timezone, current_time)
    hour, min = time_string.split(":").map(&:to_i)
    Time.find_zone(timezone).local(current_time.year, current_time.month, current_time.day, hour, min)
  end

  def within_window?(current_time, scheduled_time)
    (current_time - scheduled_time).abs < 5.minutes
  end
end
