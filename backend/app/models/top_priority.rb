# frozen_string_literal: true

class TopPriority < ApplicationRecord
  MAX_PRIORITIES = 3

  belongs_to :daily_plan
  belongs_to :goal, optional: true

  has_many :mentions, as: :mentionable, dependent: :destroy

  validates :title, presence: true
  validates :priority_order, presence: true,
                             numericality: { only_integer: true, in: 1..MAX_PRIORITIES }
  validates :priority_order, uniqueness: { scope: :daily_plan_id, message: :already_exists }
  validate :max_priorities_per_plan

  scope :ordered, -> { order(:priority_order) }

  private

  def max_priorities_per_plan
    return unless daily_plan

    existing_count = daily_plan.top_priorities.where.not(id: id).count
    return unless existing_count >= MAX_PRIORITIES

    errors.add(:base, :max_priorities_reached)
  end
end
