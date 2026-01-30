# frozen_string_literal: true

class SendOnboardingEmailsJob < ApplicationJob
  queue_as :default

  # Email schedule: days after signup when each email should be sent
  ONBOARDING_SCHEDULE = {
    day_one: { days: 1, email: :welcome },
    day_three: { days: 3, email: :morning_planning_intro },
    day_fourteen: { days: 14, email: :two_week_check_in }
  }.freeze
  def perform
    User.where(onboarding_unsubscribed: false)
        .where(created_at: 15.days.ago..)
        .find_each { |user| process_user(user) }
  end

  private

  def process_user(user)
    return unless should_send_emails?(user)

    ONBOARDING_SCHEDULE.each do |email_key, config|
      process_email(user, email_key, config)
    end
  end

  def should_send_emails?(user)
    # Respect email notification preferences
    preference = user.notification_preference || NotificationPreference.find_or_create_for(user)
    preference.email
  end

  def process_email(user, email_key, config)
    return if email_already_sent?(user, email_key)
    return unless days_since_signup(user) >= config[:days]
    return if skip_email?(user, email_key)

    send_email(user, config[:email])
    record_email_sent(user, email_key)
  end

  def email_already_sent?(user, email_key)
    user.onboarding_emails_sent&.key?(email_key.to_s)
  end

  def days_since_signup(user)
    (Time.current.to_date - user.created_at.to_date).to_i
  end

  def skip_email?(user, email_key)
    case email_key
    when :day_three
      skip_morning_planning_email?(user)
    else
      false
    end
  end

  def skip_morning_planning_email?(user)
    # Skip if user already has daily plans
    user.daily_plans.exists?
  end

  def send_email(user, email_method)
    OnboardingMailer.send(email_method, user).deliver_later
  end

  def record_email_sent(user, email_key)
    emails_sent = user.onboarding_emails_sent || {}
    emails_sent[email_key.to_s] = Time.current.iso8601
    user.update!(onboarding_emails_sent: emails_sent)
  end
end
