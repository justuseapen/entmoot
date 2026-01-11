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
      scope.joins(daily_plan: :family).where(families: { id: user.family_ids })
    end
  end

  private

  def owner?
    record.daily_plan.user_id == user.id
  end

  def owner_or_family_member?
    owner? || user.member_of?(record.family)
  end
end
