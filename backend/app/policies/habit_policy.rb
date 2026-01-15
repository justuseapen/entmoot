# frozen_string_literal: true

class HabitPolicy < ApplicationPolicy
  def index?
    member?
  end

  def create?
    member?
  end

  def update?
    owns_habit? && member?
  end

  def destroy?
    owns_habit? && member?
  end

  def update_positions?
    member?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(user: user)
    end
  end

  private

  def family
    record.is_a?(Habit) ? record.family : record
  end

  def member?
    user.member_of?(family)
  end

  def owns_habit?
    record.is_a?(Habit) && record.user_id == user.id
  end
end
