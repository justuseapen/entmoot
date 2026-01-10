# frozen_string_literal: true

class GoalAssignment < ApplicationRecord
  belongs_to :goal
  belongs_to :user

  validates :goal_id, uniqueness: { scope: :user_id, message: :already_assigned }
  validate :user_must_be_family_member

  private

  def user_must_be_family_member
    return if goal.nil? || user.nil?

    errors.add(:user, :not_family_member) unless user.member_of?(goal.family)
  end
end
