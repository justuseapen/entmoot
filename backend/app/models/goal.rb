# frozen_string_literal: true

class Goal < ApplicationRecord
  include Mentionable

  belongs_to :family
  belongs_to :creator, class_name: "User"
  belongs_to :parent, class_name: "Goal", optional: true

  has_many :children, class_name: "Goal", foreign_key: :parent_id, dependent: :nullify, inverse_of: :parent
  has_many :goal_assignments, dependent: :destroy
  has_many :assignees, through: :goal_assignments, source: :user
  has_many :calendar_sync_mappings, as: :syncable, dependent: :destroy

  # Mentions association is provided by the Mentionable concern
  mentionable_fields :title, :description

  enum :time_scale, {
    daily: 0,
    weekly: 1,
    monthly: 2,
    quarterly: 3,
    annual: 4
  }, validate: true

  enum :status, {
    not_started: 0,
    in_progress: 1,
    at_risk: 2,
    completed: 3,
    abandoned: 4
  }, validate: true

  enum :visibility, {
    personal: 0,
    shared: 1,
    family: 2
  }, validate: true

  validates :title, presence: true
  validates :progress, numericality: { only_integer: true, in: 0..100 }

  scope :by_time_scale, lambda { |time_scale|
    where(time_scale: time_scale) if time_scale.present?
  }
  scope :by_status, lambda { |status|
    where(status: status) if status.present?
  }
  scope :by_visibility, lambda { |visibility|
    where(visibility: visibility) if visibility.present?
  }
  scope :by_assignee, lambda { |user_id|
    joins(:goal_assignments).where(goal_assignments: { user_id: user_id }) if user_id.present?
  }
  scope :mentioned_by, lambda { |user_id|
    joins(:mentions).where(mentions: { mentioned_user_id: user_id }).distinct if user_id.present?
  }

  def assign_user(user)
    goal_assignments.find_or_create_by(user: user)
  end

  def unassign_user(user)
    goal_assignments.find_by(user: user)&.destroy
  end

  def assigned_to?(user)
    goal_assignments.exists?(user: user)
  end

  def visible_to?(user)
    case visibility
    when "personal"
      creator_id == user.id
    when "shared"
      creator_id == user.id || assigned_to?(user)
    when "family"
      user.member_of?(family)
    else
      false
    end
  end

  # Returns all user IDs that should have this goal synced to their calendar
  def user_ids
    assignees.pluck(:id)
  end

  # Returns aggregated progress from children, or own progress if no children
  def aggregated_progress
    return progress if children.empty?

    children.where.not(status: :abandoned).average(:progress)&.round || 0
  end

  # Count of non-abandoned children
  def children_count
    children.where.not(status: :abandoned).count
  end

  # Count of draft children awaiting review
  def draft_children_count
    children.where(is_draft: true).count
  end

  after_destroy :remove_from_calendars
  # Calendar sync callbacks
  after_commit :schedule_calendar_sync, on: %i[create update], if: :should_sync_to_calendar?

  private

  def should_sync_to_calendar?
    # Only sync if relevant attributes changed
    saved_change_to_title? ||
      saved_change_to_due_date? ||
      saved_change_to_status? ||
      saved_change_to_description?
  end

  def schedule_calendar_sync
    assignees.each do |user|
      next unless user.calendar_sync_enabled?

      CalendarSyncJob.perform_later(
        user.id,
        syncable_type: "Goal",
        syncable_id: id
      )
    end
  end

  def remove_from_calendars
    calendar_sync_mappings.each do |mapping|
      CalendarRemoveEventJob.perform_later(
        mapping.user_id,
        mapping.google_event_id,
        mapping.google_calendar_id
      )
    end
  end
end
