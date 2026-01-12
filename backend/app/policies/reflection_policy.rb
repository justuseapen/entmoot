# frozen_string_literal: true

class ReflectionPolicy < ApplicationPolicy
  def index?
    user.member_of?(record)
  end

  def show?
    owner_or_family_member?
  end

  def create?
    user.member_of?(record)
  end

  def update?
    owner?
  end

  def destroy?
    owner?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      # Handle both daily_plan-based and quick reflections
      scope.left_joins(:daily_plan)
           .where("reflections.family_id IN (:family_ids) OR daily_plans.family_id IN (:family_ids)",
                  family_ids: user.family_ids)
    end
  end

  private

  def owner?
    # For quick reflections, use direct user association
    # For regular reflections, use daily_plan.user_id
    if record.quick?
      record.user_id == user.id
    else
      record.daily_plan&.user_id == user.id
    end
  end

  def owner_or_family_member?
    owner? || user.member_of?(effective_family)
  end

  def effective_family
    # For quick reflections, use direct family association
    # For regular reflections, use daily_plan.family
    record.quick? ? record.family : record.daily_plan&.family
  end
end
