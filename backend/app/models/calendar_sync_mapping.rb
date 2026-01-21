# frozen_string_literal: true

class CalendarSyncMapping < ApplicationRecord
  belongs_to :user
  belongs_to :syncable, polymorphic: true

  validates :google_event_id, presence: true, uniqueness: { scope: :user_id }
  validates :google_calendar_id, presence: true
  validates :syncable_type, inclusion: {
    in: %w[Goal WeeklyReview MonthlyReview QuarterlyReview AnnualReview]
  }

  scope :for_goals, -> { where(syncable_type: "Goal") }
  scope :for_reviews, -> { where(syncable_type: %w[WeeklyReview MonthlyReview QuarterlyReview AnnualReview]) }
  scope :stale, -> { where(last_synced_at: ...24.hours.ago) }
end
