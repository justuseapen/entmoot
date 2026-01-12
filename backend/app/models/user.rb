# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  has_many :refresh_tokens, dependent: :destroy
  has_many :family_memberships, dependent: :destroy
  has_many :families, through: :family_memberships
  has_many :sent_invitations, class_name: "Invitation", foreign_key: :inviter_id, dependent: :destroy,
                              inverse_of: :inviter
  has_many :created_goals, class_name: "Goal", foreign_key: :creator_id, dependent: :destroy, inverse_of: :creator
  has_many :goal_assignments, dependent: :destroy
  has_many :assigned_goals, through: :goal_assignments, source: :goal
  has_many :daily_plans, dependent: :destroy
  has_many :weekly_reviews, dependent: :destroy
  has_one :notification_preference, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :streaks, dependent: :destroy
  has_many :user_badges, dependent: :destroy
  has_many :badges, through: :user_badges
  has_many :points_ledger_entries, dependent: :destroy

  validates :name, presence: true

  def jwt_payload
    { user_id: id }
  end

  def membership_for(family)
    family_memberships.find_by(family: family)
  end

  def role_in(family)
    membership_for(family)&.role
  end

  def admin_of?(family)
    role_in(family) == "admin"
  end

  def member_of?(family)
    families.include?(family)
  end

  def total_points
    PointsService.total_points(self)
  end

  def weekly_points
    PointsService.weekly_points(self)
  end
end
