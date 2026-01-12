# frozen_string_literal: true

class NotificationPreference < ApplicationRecord
  belongs_to :user

  # Validations for time format (HH:MM)
  TIME_FORMAT = /\A([01]\d|2[0-3]):([0-5]\d)\z/

  validates :morning_planning_time, format: { with: TIME_FORMAT, message: :invalid_time_format }
  validates :evening_reflection_time, format: { with: TIME_FORMAT, message: :invalid_time_format }
  validates :weekly_review_time, format: { with: TIME_FORMAT, message: :invalid_time_format }
  validates :quiet_hours_start, format: { with: TIME_FORMAT, message: :invalid_time_format }
  validates :quiet_hours_end, format: { with: TIME_FORMAT, message: :invalid_time_format }

  validates :weekly_review_day, numericality: { in: 0..6 }

  # Find or create for a user - ensures each user has notification preferences
  def self.find_or_create_for(user)
    find_or_create_by(user: user)
  end

  # Contextual tip types
  TIP_TYPES = %w[
    goals_page
    first_reflection
    first_family_member
    first_daily_plan
    first_weekly_review
  ].freeze

  # Check if a specific tip has been shown
  def tip_shown?(tip_type)
    shown_tips.include?(tip_type.to_s)
  end

  # Mark a tip as shown
  def mark_tip_shown!(tip_type)
    return false unless TIP_TYPES.include?(tip_type.to_s)
    return false if tip_shown?(tip_type)

    update(shown_tips: shown_tips + [tip_type.to_s])
  end

  # Check if tips should be shown for a given type
  def should_show_tip?(tip_type)
    tips_enabled && !tip_shown?(tip_type)
  end

  # Check if a given time is within quiet hours
  def within_quiet_hours?(time)
    current_mins = time_to_minutes(time.hour, time.min)
    start_mins = parse_time_to_minutes(quiet_hours_start)
    end_mins = parse_time_to_minutes(quiet_hours_end)

    in_range?(current_mins, start_mins, end_mins)
  end

  # Get the next scheduled time for a reminder type
  def next_reminder_time(reminder_type, timezone)
    return nil unless send(reminder_type)

    scheduled = build_scheduled_time(reminder_type, timezone)
    adjust_for_reminder_type(scheduled, reminder_type, timezone)
  end

  private

  def time_to_minutes(hour, min)
    (hour * 60) + min
  end

  def parse_time_to_minutes(time_string)
    hour, min = time_string.split(":").map(&:to_i)
    time_to_minutes(hour, min)
  end

  def in_range?(current_mins, start_mins, end_mins)
    if start_mins <= end_mins
      current_mins >= start_mins && current_mins < end_mins
    else
      current_mins >= start_mins || current_mins < end_mins
    end
  end

  def build_scheduled_time(reminder_type, timezone)
    time_string = send("#{reminder_type}_time")
    hour, min = time_string.split(":").map(&:to_i)
    tz = Time.find_zone(timezone)
    now = tz.now
    tz.local(now.year, now.month, now.day, hour, min)
  end

  def adjust_for_reminder_type(scheduled, reminder_type, timezone)
    tz = Time.find_zone(timezone)
    now = tz.now

    if reminder_type == :weekly_review
      adjust_for_weekly_review(scheduled, now)
    elsif now >= scheduled
      scheduled + 1.day
    else
      scheduled
    end
  end

  def adjust_for_weekly_review(scheduled, now)
    days_until = (weekly_review_day - now.wday) % 7
    days_until = 7 if days_until.zero? && now >= scheduled
    scheduled + days_until.days
  end
end
