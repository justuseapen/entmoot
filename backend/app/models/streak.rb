# frozen_string_literal: true

class Streak < ApplicationRecord
  belongs_to :user

  # Streak types: daily_planning, evening_reflection, weekly_review
  enum :streak_type, {
    daily_planning: 0,
    evening_reflection: 1,
    weekly_review: 2
  }, validate: true

  validates :streak_type, presence: true
  validates :streak_type, uniqueness: { scope: :user_id, message: :already_exists }
  validates :current_count, numericality: { greater_than_or_equal_to: 0 }
  validates :longest_count, numericality: { greater_than_or_equal_to: 0 }

  scope :for_user, ->(user) { where(user: user) }

  # Milestone thresholds for notifications
  MILESTONE_THRESHOLDS = [7, 14, 30, 60, 90, 180, 365].freeze

  # Find or create a streak for a specific type
  def self.find_or_create_for(user:, streak_type:)
    find_or_create_by(user: user, streak_type: streak_type)
  end

  # Check if the current count just crossed a milestone threshold
  def milestone_reached?
    MILESTONE_THRESHOLDS.include?(current_count)
  end

  # Check if the streak was broken (missed day/week)
  def broken?(current_date, grace_period_days: 0)
    return false if last_activity_date.nil?

    expected_gap = weekly_review? ? 7 : 1
    max_gap = expected_gap + grace_period_days
    (current_date - last_activity_date).to_i > max_gap
  end

  # Record activity and update streak. Returns true if activity was recorded,
  # false if already recorded for this period.
  # rubocop:disable Naming/PredicateMethod
  def record_activity!(activity_date)
    if activity_already_recorded?(activity_date)
      # Already recorded for this period, no change
      return false
    end

    if should_continue_streak?(activity_date)
      increment_streak!(activity_date)
    else
      reset_and_start_streak!(activity_date)
    end

    true
  end
  # rubocop:enable Naming/PredicateMethod

  private

  def activity_already_recorded?(activity_date)
    return false if last_activity_date.nil?

    if weekly_review?
      # For weekly reviews, check if it's the same week
      last_activity_date >= (activity_date - 6.days)
    else
      # For daily activities, check if it's the same day
      last_activity_date == activity_date
    end
  end

  def should_continue_streak?(activity_date)
    return true if last_activity_date.nil?

    expected_gap = weekly_review? ? 7 : 1
    days_since_last = (activity_date - last_activity_date).to_i

    # Streak continues if activity is within expected time (allow same day or next expected day)
    days_since_last.between?(0, expected_gap)
  end

  def increment_streak!(activity_date)
    new_count = current_count + 1
    update!(
      current_count: new_count,
      longest_count: [longest_count, new_count].max,
      last_activity_date: activity_date
    )
  end

  def reset_and_start_streak!(activity_date)
    update!(
      current_count: 1,
      last_activity_date: activity_date
    )
  end
end
