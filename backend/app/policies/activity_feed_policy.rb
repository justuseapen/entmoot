# frozen_string_literal: true

class ActivityFeedPolicy < ApplicationPolicy
  # Allow any family member to view the activity feed
  def show?
    user_family_membership.present?
  end

  private

  def user_family_membership
    return @user_family_membership if defined?(@user_family_membership)

    @user_family_membership = record.family_memberships.find_by(user: user)
  end
end
