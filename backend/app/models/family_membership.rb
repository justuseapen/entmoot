# frozen_string_literal: true

class FamilyMembership < ApplicationRecord
  belongs_to :family
  belongs_to :user

  enum :role, {
    observer: 0,
    child: 1,
    teen: 2,
    adult: 3,
    admin: 4
  }, validate: true

  validates :family_id, uniqueness: { scope: :user_id, message: :user_already_member }
  validate :user_belongs_to_only_one_family, on: :create

  scope :for_user, ->(user) { where(user: user) }

  def can_manage_goals?
    admin? || adult?
  end

  def can_invite?
    admin? || adult?
  end

  def can_manage_family?
    admin?
  end

  def can_manage_pets?
    admin? || adult?
  end

  private

  def user_belongs_to_only_one_family
    return unless user

    if user.family_memberships.exists?
      errors.add(:user, :already_has_family, message: "already belongs to a family")
    end
  end
end
