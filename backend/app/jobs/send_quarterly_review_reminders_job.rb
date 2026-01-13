# frozen_string_literal: true

class SendQuarterlyReviewRemindersJob < ApplicationJob
  queue_as :default

  # Quarter end dates: March 31, June 30, September 30, December 31
  QUARTER_END_MONTHS = [3, 6, 9, 12].freeze

  def perform
    User.joins(:notification_preference)
        .where(notification_preferences: { quarterly_review: true })
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

    # Check if we're in the last week of a quarter
    return unless in_last_week_of_quarter?(current_time)

    # Check quiet hours
    return if preference.within_quiet_hours?(current_time)

    # Send email if email notifications are enabled
    send_email_reminder(user, family) if preference.email

    # Send push notification if push is enabled
    send_push_reminder(user, family) if preference.push
  end

  def in_last_week_of_quarter?(current_time)
    return false unless QUARTER_END_MONTHS.include?(current_time.month)

    # Last day of the quarter month
    last_day = current_time.end_of_month.day

    # Last week is the last 7 days of the quarter
    current_time.day >= (last_day - 6)
  end

  def send_email_reminder(user, family)
    ReminderMailer.quarterly_review(user, family).deliver_later
  end

  def send_push_reminder(user, family)
    NotificationService.create_and_broadcast(
      user: user,
      title: "Quarterly Review Time",
      body: "Assess your quarterly progress and set objectives for next quarter!",
      link: "/families/#{family.id}/quarterly-review",
      notification_type: :reminder
    )
  end
end
