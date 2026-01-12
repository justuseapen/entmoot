# frozen_string_literal: true

class FeedbackReport < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :assigned_to, class_name: "User", optional: true
  belongs_to :duplicate_of, class_name: "FeedbackReport", optional: true
  has_many :duplicates, class_name: "FeedbackReport", foreign_key: :duplicate_of_id, dependent: :nullify,
                        inverse_of: :duplicate_of

  # Attachment for screenshot
  has_one_attached :screenshot

  # Report types
  REPORT_TYPES = %w[bug feature_request feedback nps quick_feedback].freeze

  enum :report_type, {
    bug: "bug",
    feature_request: "feature_request",
    feedback: "feedback",
    nps: "nps",
    quick_feedback: "quick_feedback"
  }, validate: true

  # Severity levels (for bugs only)
  SEVERITY_LEVELS = %w[blocker major minor cosmetic].freeze

  enum :severity, {
    blocker: "blocker",
    major: "major",
    minor: "minor",
    cosmetic: "cosmetic"
  }, prefix: true

  # Status workflow
  STATUSES = %w[new acknowledged in_progress resolved closed].freeze

  enum :status, {
    new: "new",
    acknowledged: "acknowledged",
    in_progress: "in_progress",
    resolved: "resolved",
    closed: "closed"
  }, prefix: true, validate: true

  validates :title, presence: true
  validates :report_type, presence: true
  validates :description, presence: true, if: :bug?
  validates :severity, inclusion: { in: SEVERITY_LEVELS }, allow_nil: true
  validates :contact_email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

  scope :by_type, ->(type) { where(report_type: type) if type.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_severity, ->(severity) { where(severity: severity) if severity.present? }
  scope :by_date_range, lambda { |start_date, end_date|
    scope = all
    scope = scope.where(created_at: start_date..) if start_date.present?
    scope = scope.where(created_at: ..end_date.end_of_day) if end_date.present?
    scope
  }
  scope :recent, -> { order(created_at: :desc) }
  scope :unassigned, -> { where(assigned_to_id: nil) }
  scope :assigned_to_user, ->(user_id) { where(assigned_to_id: user_id) if user_id.present? }
  scope :not_duplicates, -> { where(duplicate_of_id: nil) }

  def resolve!
    update!(status: "resolved", resolved_at: Time.current)
  end

  def mark_as_duplicate!(original_id)
    update!(duplicate_of_id: original_id, status: "closed")
  end

  def duplicate?
    duplicate_of_id.present?
  end
end
