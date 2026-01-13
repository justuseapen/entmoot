# frozen_string_literal: true

class SendMonthlyReviewRemindersJob < ApplicationJob
  queue_as :default

  def perform
    User.joins(:notification_preference)
        .where(notification_preferences: { monthly_review: true })
        .find_each do |user|
          send_reminder_if_due(user)
    end
  end

  private

  def send_reminder_if_due(user)
    preference = user.notification_preference
    family = user.families.first
    return unless family

    # Skip if check-in frequency doesn't include monthly reminders
    return unless preference.monthly_reminders_enabled?

    timezone = family.timezone || "UTC"
    current_time = Time.current.in_time_zone(timezone)

    # Check if today is the monthly review day
    return unless current_time.day == preference.monthly_review_day

    # Check quiet hours
    return if preference.within_quiet_hours?(current_time)

    # Send email if email notifications are enabled
    send_email_reminder(user, family) if preference.email

    # Send push notification if push is enabled
    send_push_reminder(user, family) if preference.push
  end

  def send_email_reminder(user, family)
    ReminderMailer.monthly_review(user, family).deliver_later
  end

  def send_push_reminder(user, family)
    NotificationService.create_and_broadcast(
      user: user,
      title: "Monthly Review Time",
      body: "Reflect on your month and plan ahead for next month!",
      link: "/families/#{family.id}/monthly-review",
      notification_type: :reminder
    )
  end
end
