# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: Devise::JWT::RevocationStrategies::Null

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
  has_one :google_calendar_credential, dependent: :destroy
  has_many :calendar_sync_mappings, dependent: :destroy
  has_many :mentions_created, class_name: "Mention", dependent: :destroy, inverse_of: :user
  has_many :mentions, foreign_key: :mentioned_user_id, dependent: :destroy, inverse_of: :mentioned_user

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

  # Single-family convenience methods
  def family
    families.first
  end

  def family_membership
    family_memberships.first
  end

  def role
    family_membership&.role
  end

  def has_family?
    family_memberships.exists?
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

  def calendar_sync_enabled?
    google_calendar_credential&.active?
  end

  # Determines if user needs to complete onboarding wizard
  # Returns false if already completed, or if user has existing data (families and goals)
  def onboarding_required?
    return false if onboarding_wizard_completed_at.present?
    return false if families.any? && created_goals.any?

    true
  end
end
