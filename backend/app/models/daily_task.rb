# frozen_string_literal: true

class DailyTask < ApplicationRecord
  belongs_to :daily_plan
  belongs_to :goal, optional: true
  belongs_to :assignee, class_name: "User", optional: true

  validates :title, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :assignee_is_family_member

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

  def assignee_is_family_member
    return if assignee_id.nil?

    family = daily_plan&.family
    return if family.nil?

    return if family.family_memberships.exists?(user_id: assignee_id)

    errors.add(:assignee, "must be a member of the family")
  end

  def set_default_position
    return if position.present?

    max_position = daily_plan&.daily_tasks&.maximum(:position) || -1
    self.position = max_position + 1
  end
end
