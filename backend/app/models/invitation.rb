# frozen_string_literal: true

class Invitation < ApplicationRecord
  belongs_to :family
  belongs_to :inviter, class_name: "User"

  enum :role, {
    observer: 0,
    child: 1,
    teen: 2,
    adult: 3,
    admin: 4
  }, validate: true

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :token, presence: true, uniqueness: true
  validates :expires_at, presence: true

  before_validation :generate_token, on: :create
  before_validation :set_expiration, on: :create

  scope :pending, -> { where(accepted_at: nil).where("expires_at > ?", Time.current) }
  scope :expired, -> { where(accepted_at: nil).where(expires_at: ..Time.current) }

  def pending?
    accepted_at.nil? && expires_at > Time.current
  end

  def expired?
    accepted_at.nil? && expires_at <= Time.current
  end

  def accepted?
    accepted_at.present?
  end

  def accept!(user) # rubocop:disable Naming/PredicateMethod
    return false if expired? || accepted?

    transaction do
      update!(accepted_at: Time.current)
      FamilyMembership.create!(
        family: family,
        user: user,
        role: role
      )
    end
    true
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(32)
  end

  def set_expiration
    self.expires_at ||= 7.days.from_now
  end
end
