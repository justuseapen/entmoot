# frozen_string_literal: true

class DeviceToken < ApplicationRecord
  belongs_to :user

  PLATFORMS = %w[ios android web].freeze

  validates :token, presence: true, uniqueness: true
  validates :platform, presence: true, inclusion: { in: PLATFORMS }

  scope :active, -> { where("last_used_at > ?", 30.days.ago).or(where(last_used_at: nil)) }
  scope :for_platform, ->(platform) { where(platform: platform) }

  # Update last_used_at timestamp
  def touch_last_used!
    update(last_used_at: Time.current)
  end

  # Check if token is stale (not used in 30 days)
  def stale?
    last_used_at.present? && last_used_at < 30.days.ago
  end
end
