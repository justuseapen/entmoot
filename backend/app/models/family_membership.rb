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
end
