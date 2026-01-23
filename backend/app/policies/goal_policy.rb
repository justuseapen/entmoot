# frozen_string_literal: true

class GoalPolicy < ApplicationPolicy
  def index?
    member?
  end

  def show?
    member? && record.visible_to?(user)
  end

  def create?
    can_manage_goals?
  end

  def update?
    can_manage_goals? && record.visible_to?(user)
  end

  def destroy?
    can_manage_goals? && record.visible_to?(user)
  end

  def refine?
    member? && record.visible_to?(user)
  end

  def regenerate_sub_goals?
    can_manage_goals? && record.visible_to?(user)
  end

  def update_positions?
    can_manage_goals?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      # Start with goals in families the user is a member of
      base_scope = scope.joins(family: :family_memberships)
                        .where(family_memberships: { user_id: user.id })

      # Filter based on visibility rules:
      # - Family visibility: all family members can see
      # - Shared visibility: creator and assigned users can see
      # - Personal visibility: only creator can see
      base_scope.where(<<~SQL.squish, user_id: user.id)
        goals.visibility = 2
        OR (goals.visibility = 1 AND (goals.creator_id = :user_id OR goals.id IN (
          SELECT goal_id FROM goal_assignments WHERE user_id = :user_id
        )))
        OR (goals.visibility = 0 AND goals.creator_id = :user_id)
      SQL
    end
  end

  private

  def family
    record.is_a?(Goal) ? record.family : record
  end

  def member?
    user.member_of?(family)
  end

  def membership
    @membership ||= user.membership_for(family)
  end

  def can_manage_goals?
    membership&.can_manage_goals?
  end
end
