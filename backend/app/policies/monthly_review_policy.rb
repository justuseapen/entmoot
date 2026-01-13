# frozen_string_literal: true

class MonthlyReviewPolicy < ApplicationPolicy
  def index?
    user.member_of?(record)
  end

  def current?
    user.member_of?(record)
  end

  def show?
    owner_or_family_member?
  end

  def update?
    record.user_id == user.id
  end

  def destroy?
    record.user_id == user.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.joins(:family).where(families: { id: user.family_ids })
    end
  end

  private

  def owner_or_family_member?
    record.user_id == user.id || user.member_of?(record.family)
  end
end
