# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

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
  has_many :monthly_reviews, dependent: :destroy
  has_many :quarterly_reviews, dependent: :destroy
  has_many :annual_reviews, dependent: :destroy
  has_one :notification_preference, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :streaks, dependent: :destroy
  has_many :user_badges, dependent: :destroy
  has_many :badges, through: :user_badges
  has_many :points_ledger_entries, dependent: :destroy
  has_many :reflections, dependent: :destroy
  has_many :feedback_reports, dependent: :nullify
  has_many :device_tokens, dependent: :destroy
  has_many :outreach_histories, dependent: :destroy
  has_many :habits, dependent: :destroy

  validates :name, presence: true

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

  # First action tracking methods
  FIRST_ACTION_TYPES = %w[goal_created reflection_completed daily_plan_completed invitation_accepted].freeze

  def first_action_completed?(action_type)
    first_actions&.key?(action_type.to_s)
  end

  def record_first_action?(action_type)
    return false unless FIRST_ACTION_TYPES.include?(action_type.to_s)
    return false if first_action_completed?(action_type)

    update(first_actions: (first_actions || {}).merge(action_type.to_s => Time.current.iso8601))
  end
end
