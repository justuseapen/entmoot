# frozen_string_literal: true

class UserBadge < ApplicationRecord
  belongs_to :user
  belongs_to :badge

  validates :earned_at, presence: true
  validates :user_id, uniqueness: { scope: :badge_id, message: :already_earned }

  scope :recent, -> { order(earned_at: :desc) }
  scope :for_user, ->(user) { where(user: user) }

  # Callback to set earned_at to current time if not provided
  before_validation :set_earned_at, on: :create

  private

  def set_earned_at
    self.earned_at ||= Time.current
  end
end
