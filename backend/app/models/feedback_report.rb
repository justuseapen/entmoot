# frozen_string_literal: true

class FeedbackReport < ApplicationRecord
  belongs_to :user, optional: true

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
  scope :recent, -> { order(created_at: :desc) }

  def resolve!
    update!(status: "resolved", resolved_at: Time.current)
  end
end
