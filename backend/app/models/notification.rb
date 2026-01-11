# frozen_string_literal: true

class Notification < ApplicationRecord
  belongs_to :user

  # Notification types for categorization
  enum :notification_type, {
    general: "general",
    reminder: "reminder",
    goal_update: "goal_update",
    family_invite: "family_invite",
    badge_earned: "badge_earned",
    streak_milestone: "streak_milestone"
  }, validate: true

  validates :title, presence: true
  validates :notification_type, presence: true

  scope :unread, -> { where(read: false) }
  scope :recent, -> { order(created_at: :desc).limit(10) }

  def mark_as_read!
    update!(read: true)
  end
end
