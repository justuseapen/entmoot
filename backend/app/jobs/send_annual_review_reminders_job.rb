# frozen_string_literal: true

class SendAnnualReviewRemindersJob < ApplicationJob
  queue_as :default

  # December 20-31 is the annual review period
  ANNUAL_REVIEW_MONTH = 12
  ANNUAL_REVIEW_START_DAY = 20
  ANNUAL_REVIEW_END_DAY = 31

  def perform
    User.joins(:notification_preference)
        .where(notification_preferences: { annual_review: true })
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

    # Check if we're in the annual review period (December 20-31)
    return unless in_annual_review_period?(current_time)

    # Check quiet hours
    return if preference.within_quiet_hours?(current_time)

    # Send email if email notifications are enabled
    send_email_reminder(user, family) if preference.email

    # Send push notification if push is enabled
    send_push_reminder(user, family) if preference.push
  end

  def in_annual_review_period?(current_time)
    current_time.month == ANNUAL_REVIEW_MONTH &&
      current_time.day >= ANNUAL_REVIEW_START_DAY &&
      current_time.day <= ANNUAL_REVIEW_END_DAY
  end

  def send_email_reminder(user, family)
    ReminderMailer.annual_review(user, family).deliver_later
  end

  def send_push_reminder(user, family)
    NotificationService.create_and_broadcast(
      user: user,
      title: "Annual Review Time",
      body: "Reflect on your year and set intentions for the new year!",
      link: "/families/#{family.id}/annual-review",
      notification_type: :reminder
    )
  end
end
