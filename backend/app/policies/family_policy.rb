# frozen_string_literal: true

class FamilyPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    member?
  end

  def create?
    true
  end

  def update?
    admin?
  end

  def destroy?
    admin?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.joins(:family_memberships).where(family_memberships: { user_id: user.id })
    end
  end

  private

  def member?
    user.member_of?(record)
  end

  def admin?
    user.admin_of?(record)
  end

  def membership
    @membership ||= user.membership_for(record)
  end
end
