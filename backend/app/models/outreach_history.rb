# frozen_string_literal: true

# Tracks outreach messages sent to users for re-engagement purposes
# Used for spam prevention and analytics
class OutreachHistory < ApplicationRecord
  belongs_to :user

  # Outreach types - match reasons from ReengagementDetectionService
  OUTREACH_TYPES = %w[
    missed_checkin
    missed_reflection
    inactive_3_days
    inactive_7_days
    inactive_14_days
    inactive_30_days
  ].freeze

  # Notification channels
  CHANNELS = %w[push email sms].freeze

  validates :outreach_type, presence: true, inclusion: { in: OUTREACH_TYPES }
  validates :channel, presence: true, inclusion: { in: CHANNELS }
  validates :sent_at, presence: true

  # Scope for finding outreach within a time range
  scope :within_period, ->(start_time, end_time) { where(sent_at: start_time..end_time) }
  scope :today, -> { within_period(Time.current.beginning_of_day, Time.current.end_of_day) }
  scope :for_type, ->(outreach_type) { where(outreach_type: outreach_type) }
  scope :via_channel, ->(channel) { where(channel: channel) }

  # Check if user has already received outreach of this type today
  def self.already_sent_today?(user:, outreach_type:)
    where(user: user)
      .for_type(outreach_type)
      .today
      .exists?
  end

  # Record a new outreach event
  def self.record!(user:, outreach_type:, channel:)
    create!(
      user: user,
      outreach_type: outreach_type.to_s,
      channel: channel.to_s,
      sent_at: Time.current
    )
  end
end
