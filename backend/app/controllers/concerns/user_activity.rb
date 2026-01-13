# frozen_string_literal: true

module UserActivity
  extend ActiveSupport::Concern

  included do
    before_action :track_user_activity, if: :user_signed_in?
  end

  # Debounce interval in seconds - only update last_active_at if more than 1 hour has passed
  ACTIVITY_DEBOUNCE_INTERVAL = 1.hour

  private

  def track_user_activity
    return unless current_user

    # Only update if last_active_at is nil or more than 1 hour has passed
    return unless should_update_activity?

    current_user.update_column(:last_active_at, Time.current)
  end

  def should_update_activity?
    current_user.last_active_at.nil? || current_user.last_active_at < ACTIVITY_DEBOUNCE_INTERVAL.ago
  end

  # Methods to be called by specific controllers to track activity-specific timestamps

  def track_daily_plan_activity
    return unless current_user

    current_user.update_column(:last_daily_plan_at, Time.current)
  end

  def track_reflection_activity
    return unless current_user

    current_user.update_column(:last_reflection_at, Time.current)
  end

  def track_weekly_review_activity
    return unless current_user

    current_user.update_column(:last_weekly_review_at, Time.current)
  end
end
