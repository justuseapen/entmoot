# frozen_string_literal: true

class GoogleCalendarCredential < ApplicationRecord
  belongs_to :user
  has_many :calendar_sync_mappings, through: :user

  encrypts :access_token
  encrypts :refresh_token

  enum :sync_status, { active: "active", paused: "paused", error: "error" }

  validates :calendar_id, presence: true
  validates :token_expires_at, presence: true
  validates :access_token, presence: true
  validates :refresh_token, presence: true

  scope :needing_refresh, -> { where(token_expires_at: ...5.minutes.from_now) }
  scope :active_and_valid, -> { active.where("token_expires_at > ?", Time.current) }

  def token_expired?
    token_expires_at < Time.current
  end

  def token_expiring_soon?
    token_expires_at < 5.minutes.from_now
  end

  def mark_error!(message)
    update!(sync_status: :error, last_error: message)
  end

  def mark_synced!
    update!(last_sync_at: Time.current, sync_status: :active, last_error: nil)
  end
end
