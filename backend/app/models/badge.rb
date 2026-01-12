# frozen_string_literal: true

class Badge < ApplicationRecord
  has_many :user_badges, dependent: :destroy
  has_many :users, through: :user_badges

  # Badge categories for organization
  CATEGORIES = %w[goals planning reflection streaks general].freeze

  validates :name, presence: true, uniqueness: true
  validates :description, presence: true
  validates :icon, presence: true
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validates :criteria, presence: true

  scope :by_category, ->(category) { where(category: category) }

  # Check if a user has earned this badge
  def earned_by?(user)
    user_badges.exists?(user: user)
  end

  # Get the criterion value (e.g., count threshold)
  def criterion_value(key)
    criteria[key.to_s]
  end
end
