# frozen_string_literal: true

class PointsLedgerEntry < ApplicationRecord
  # Activity types with their point values
  ACTIVITY_POINTS = {
    "complete_task" => 5,
    "complete_daily_plan" => 10,
    "complete_reflection" => 20,
    "complete_weekly_review" => 50,
    "create_goal" => 15,
    "complete_goal" => 30,
    "earn_badge" => 25,
    "streak_milestone" => 50
  }.freeze

  ACTIVITY_TYPES = ACTIVITY_POINTS.keys.freeze

  belongs_to :user

  validates :points, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :activity_type, presence: true, inclusion: { in: ACTIVITY_TYPES }

  scope :recent, -> { order(created_at: :desc) }
  scope :by_activity, ->(type) { where(activity_type: type) }
  scope :in_period, ->(start_date, end_date) { where(created_at: start_date..end_date) }
  scope :today, -> { where(created_at: Time.zone.now.all_day) }
  scope :this_week, -> { where(created_at: Time.zone.now.all_week) }

  class << self
    def points_for(activity_type)
      ACTIVITY_POINTS[activity_type.to_s] || 0
    end

    def total_for_user(user)
      where(user: user).sum(:points)
    end

    def total_this_week_for_user(user)
      this_week.where(user: user).sum(:points)
    end
  end
end
