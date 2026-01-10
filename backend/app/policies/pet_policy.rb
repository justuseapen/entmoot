# frozen_string_literal: true

class PetPolicy < ApplicationPolicy
  def index?
    member?
  end

  def show?
    member?
  end

  def create?
    can_manage_pets?
  end

  def update?
    can_manage_pets?
  end

  def destroy?
    can_manage_pets?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.joins(family: :family_memberships)
           .where(family_memberships: { user_id: user.id })
    end
  end

  private

  def family
    record.is_a?(Pet) ? record.family : record
  end

  def member?
    user.member_of?(family)
  end

  def membership
    @membership ||= user.membership_for(family)
  end

  def can_manage_pets?
    membership&.can_manage_pets?
  end
end
