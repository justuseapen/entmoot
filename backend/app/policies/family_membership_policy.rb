# frozen_string_literal: true

class FamilyMembershipPolicy < ApplicationPolicy
  def index?
    member?
  end

  def show?
    member?
  end

  def update?
    admin? && !own_membership?
  end

  def destroy?
    admin? && !own_membership?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      user_memberships_join = <<~SQL.squish
        INNER JOIN family_memberships user_memberships
        ON user_memberships.family_id = family_memberships.family_id
      SQL

      scope.joins(:family).joins(user_memberships_join).where(user_memberships: { user_id: user.id })
    end
  end

  private

  def member?
    user.member_of?(record.family)
  end

  def admin?
    user.admin_of?(record.family)
  end

  def own_membership?
    record.user_id == user.id
  end
end
