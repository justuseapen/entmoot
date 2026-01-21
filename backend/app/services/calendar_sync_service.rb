# frozen_string_literal: true

class CalendarSyncService
  class Error < StandardError; end
  class SyncError < Error; end

  def initialize(user)
    @user = user
    @credential = user.google_calendar_credential
    @calendar_service = nil
  end

  # Sync a single goal to Google Calendar
  def sync_goal(goal)
    return unless should_sync?(goal)

    mapping = find_mapping(goal)

    if goal_should_have_event?(goal)
      if mapping
        update_goal_event(goal, mapping)
      else
        create_goal_event(goal)
      end
    elsif mapping
      # Goal no longer needs an event (completed, abandoned, or no due date)
      remove_event(mapping)
    end
  end

  # Sync a review reminder to Google Calendar
  def sync_review(review)
    return unless sync_enabled?

    mapping = find_mapping(review)
    review_date = review_reminder_date(review)

    return remove_event(mapping) if mapping && review_date.nil?
    return unless review_date

    if mapping
      update_review_event(review, mapping, review_date)
    else
      create_review_event(review, review_date)
    end
  end

  # Full sync - sync all goals and reviews for user
  def full_sync
    return unless sync_enabled?

    sync_all_goals
    sync_all_reviews
    @credential.mark_synced!
  rescue GoogleCalendarService::Error => e
    @credential.mark_error!("Full sync failed: #{e.message}")
    raise SyncError, e.message
  end

  # Remove an item from calendar
  def remove_syncable(syncable)
    mapping = find_mapping(syncable)
    remove_event(mapping) if mapping
  end

  private

  def sync_enabled?
    @credential&.active?
  end

  def should_sync?(goal)
    return false unless sync_enabled?
    return false unless goal.user_ids.include?(@user.id)

    true
  end

  def goal_should_have_event?(goal)
    goal.due_date.present? &&
      !goal.completed? &&
      goal.status != "abandoned"
  end

  def calendar_service
    @calendar_service ||= GoogleCalendarService.new(@user)
  end

  def find_mapping(syncable)
    @user.calendar_sync_mappings.find_by(
      syncable_type: syncable.class.name,
      syncable_id: syncable.id
    )
  end

  def create_goal_event(goal)
    event_data = build_goal_event_data(goal)

    result = calendar_service.create_event(
      calendar_id: @credential.calendar_id,
      event_data: event_data
    )

    @user.calendar_sync_mappings.create!(
      syncable: goal,
      google_event_id: result[:id],
      google_calendar_id: @credential.calendar_id,
      etag: result[:etag],
      last_synced_at: Time.current
    )
  rescue GoogleCalendarService::Error => e
    Rails.logger.error("Failed to create calendar event for goal #{goal.id}: #{e.message}")
    raise SyncError, e.message
  end

  def update_goal_event(goal, mapping)
    event_data = build_goal_event_data(goal)

    result = calendar_service.update_event(
      calendar_id: mapping.google_calendar_id,
      event_id: mapping.google_event_id,
      event_data: event_data,
      etag: mapping.etag
    )

    mapping.update!(
      etag: result[:etag],
      last_synced_at: Time.current
    )
  rescue GoogleCalendarService::EventNotFoundError
    # Event was deleted from Google Calendar, recreate it
    mapping.destroy
    create_goal_event(goal)
  rescue GoogleCalendarService::Error => e
    Rails.logger.error("Failed to update calendar event for goal #{goal.id}: #{e.message}")
    raise SyncError, e.message
  end

  def create_review_event(review, review_date)
    event_data = build_review_event_data(review, review_date)

    result = calendar_service.create_event(
      calendar_id: @credential.calendar_id,
      event_data: event_data
    )

    @user.calendar_sync_mappings.create!(
      syncable: review,
      google_event_id: result[:id],
      google_calendar_id: @credential.calendar_id,
      etag: result[:etag],
      last_synced_at: Time.current
    )
  rescue GoogleCalendarService::Error => e
    Rails.logger.error("Failed to create calendar event for review #{review.id}: #{e.message}")
    raise SyncError, e.message
  end

  def update_review_event(review, mapping, review_date)
    event_data = build_review_event_data(review, review_date)

    result = calendar_service.update_event(
      calendar_id: mapping.google_calendar_id,
      event_id: mapping.google_event_id,
      event_data: event_data,
      etag: mapping.etag
    )

    mapping.update!(
      etag: result[:etag],
      last_synced_at: Time.current
    )
  rescue GoogleCalendarService::EventNotFoundError
    # Event was deleted from Google Calendar, recreate it
    mapping.destroy
    create_review_event(review, review_date)
  rescue GoogleCalendarService::Error => e
    Rails.logger.error("Failed to update calendar event for review #{review.id}: #{e.message}")
    raise SyncError, e.message
  end

  def remove_event(mapping)
    calendar_service.delete_event(
      calendar_id: mapping.google_calendar_id,
      event_id: mapping.google_event_id
    )
  ensure
    mapping.destroy
  end

  def build_goal_event_data(goal)
    family_name = goal.family.name
    description = [
      goal.description,
      "",
      "Family: #{family_name}",
      "Status: #{goal.status&.titleize || "Active"}",
      "",
      "Managed by Entmoot"
    ].compact.join("\n")

    {
      summary: "[Goal] #{goal.title}",
      description: description,
      start: { date: goal.due_date.to_s },
      end: { date: goal.due_date.to_s }
    }
  end

  def build_review_event_data(review, review_date)
    family_name = review.family.name
    review_type = review.class.name.gsub("Review", " Review")

    description = [
      "Time to complete your #{review_type.downcase}!",
      "",
      "Family: #{family_name}",
      "Period: #{format_review_period(review)}",
      "",
      "Managed by Entmoot"
    ].join("\n")

    {
      summary: "[Entmoot] #{review_type} Due",
      description: description,
      start: { date: review_date.to_s },
      end: { date: review_date.to_s }
    }
  end

  def review_reminder_date(review)
    case review
    when WeeklyReview
      review.week_end_date
    when MonthlyReview
      Date.new(review.year, review.month, -1) # Last day of month
    when QuarterlyReview
      quarter_end_month = review.quarter * 3
      Date.new(review.year, quarter_end_month, -1)
    when AnnualReview
      Date.new(review.year, 12, 31)
    end
  end

  def format_review_period(review)
    case review
    when WeeklyReview
      "Week of #{review.week_start_date.strftime("%b %d, %Y")}"
    when MonthlyReview
      Date.new(review.year, review.month, 1).strftime("%B %Y")
    when QuarterlyReview
      "Q#{review.quarter} #{review.year}"
    when AnnualReview
      review.year.to_s
    end
  end

  def sync_all_goals
    # Get all goals the user is assigned to
    @user.assigned_goals.includes(:family).find_each do |goal|
      sync_goal(goal)
    rescue SyncError => e
      Rails.logger.error("Failed to sync goal #{goal.id}: #{e.message}")
      # Continue with other goals
    end

    # Clean up mappings for goals user is no longer assigned to
    cleanup_orphaned_goal_mappings
  end

  def sync_all_reviews
    sync_reviews_of_type(WeeklyReview)
    sync_reviews_of_type(MonthlyReview)
    sync_reviews_of_type(QuarterlyReview)
    sync_reviews_of_type(AnnualReview)
  end

  def sync_reviews_of_type(klass)
    # Only sync incomplete reviews for the current or future period
    @user.public_send(klass.name.underscore.pluralize)
         .where(completed: false)
         .includes(:family)
         .find_each do |review|
           sync_review(review)
         rescue SyncError => e
           Rails.logger.error("Failed to sync #{klass.name} #{review.id}: #{e.message}")
    end
  end

  def cleanup_orphaned_goal_mappings
    # Find mappings for goals user is no longer assigned to
    orphaned_mappings = @user.calendar_sync_mappings.for_goals.select do |mapping|
      goal = mapping.syncable
      goal.nil? || goal.user_ids.exclude?(@user.id)
    end

    orphaned_mappings.each do |mapping|
      remove_event(mapping)
    rescue StandardError => e
      Rails.logger.error("Failed to cleanup orphaned mapping #{mapping.id}: #{e.message}")
    end
  end
end
