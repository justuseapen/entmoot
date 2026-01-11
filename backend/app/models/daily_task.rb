# frozen_string_literal: true

class DailyTask < ApplicationRecord
  belongs_to :daily_plan
  belongs_to :goal, optional: true

  validates :title, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :completed, -> { where(completed: true) }
  scope :incomplete, -> { where(completed: false) }
  scope :ordered, -> { order(:position) }

  before_validation :set_default_position, on: :create

  def complete!
    update!(completed: true)
  end

  def uncomplete!
    update!(completed: false)
  end

  def toggle!
    update!(completed: !completed)
  end

  private

  def set_default_position
    return if position.present?

    max_position = daily_plan&.daily_tasks&.maximum(:position) || -1
    self.position = max_position + 1
  end
end
