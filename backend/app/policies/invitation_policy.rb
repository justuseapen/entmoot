# frozen_string_literal: true

class InvitationPolicy < ApplicationPolicy
  def index?
    member?
  end

  def create?
    can_invite?
  end

  def destroy?
    admin? || inviter?
  end

  def accept?
    true
  end

  def resend?
    can_invite?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.joins(:family)
           .joins("INNER JOIN family_memberships ON family_memberships.family_id = invitations.family_id")
           .where(family_memberships: { user_id: user.id })
    end
  end

  private

  def member?
    user.member_of?(record.family)
  end

  def admin?
    user.admin_of?(record.family)
  end

  def can_invite?
    membership = user.membership_for(record.family)
    membership&.can_invite?
  end

  def inviter?
    record.inviter_id == user.id
  end
end
