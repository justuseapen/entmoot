# frozen_string_literal: true

class Habit < ApplicationRecord
  belongs_to :user
  belongs_to :family
  has_many :habit_completions, dependent: :destroy

  validates :name, presence: true
  validates :position, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :position, uniqueness: { scope: %i[user_id family_id] }

  scope :active, -> { where(is_active: true) }
  scope :ordered, -> { order(:position) }
end
