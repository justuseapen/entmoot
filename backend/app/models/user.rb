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
  has_many :daily_plans, dependent: :destroy
  has_one :notification_preference, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :feedback_reports, dependent: :nullify
  has_many :device_tokens, dependent: :destroy
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

  # First action tracking methods
  FIRST_ACTION_TYPES = %w[daily_plan_completed invitation_accepted].freeze

  def first_action_completed?(action_type)
    first_actions&.key?(action_type.to_s)
  end

  def record_first_action?(action_type)
    return false unless FIRST_ACTION_TYPES.include?(action_type.to_s)
    return false if first_action_completed?(action_type)

    update(first_actions: (first_actions || {}).merge(action_type.to_s => Time.current.iso8601))
  end

  # Determines if user needs to complete onboarding wizard
  # Returns false if already completed, or if user has existing data (families)
  def onboarding_required?
    return false if onboarding_wizard_completed_at.present?
    return false if families.any?

    true
  end
end
