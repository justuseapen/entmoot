# frozen_string_literal: true

class ReengagementDetectionService
  INACTIVITY_THRESHOLDS = [3, 7, 14, 30].freeze
  MISSED_CHECKIN_DEADLINE_HOUR = 12 # noon
  MISSED_REFLECTION_DEADLINE_HOUR = 22 # 10pm

  INACTIVITY_PRIORITIES = { 30 => 3, 14 => 4, 7 => 5, 3 => 6 }.freeze

  # Struct to hold user info and reason for outreach
  OutreachCandidate = Struct.new(:user, :reason, :priority, keyword_init: true)

  class << self
    # Main entry point: returns users who need re-engagement, prioritized
    def detect_users_for_outreach
      candidates = []
      candidates.concat(detect_missed_checkins)
      candidates.concat(detect_missed_reflections)
      candidates.concat(detect_inactive_users)
      candidates.sort_by(&:priority)
    end

    # Detect users who scheduled morning planning but haven't created a daily plan by noon
    def detect_missed_checkins
      collect_candidates_for_users(morning_planning_users) do |user, family|
        missed_checkin_for_family?(user, family) ? make_candidate(user, :missed_checkin, 1) : nil
      end
    end

    # Detect users who have a daily plan but no evening reflection by 10pm
    def detect_missed_reflections
      collect_candidates_for_users(evening_reflection_users) do |user, family|
        missed_reflection_for_family?(user, family) ? make_candidate(user, :missed_reflection, 2) : nil
      end
    end

    # Detect users who haven't had any API activity for configurable thresholds
    def detect_inactive_users(thresholds: INACTIVITY_THRESHOLDS)
      sorted_thresholds = thresholds.sort.reverse

      reengagement_enabled_users.each_with_object([]) do |user, candidates|
        threshold = find_inactivity_threshold(user, sorted_thresholds)
        candidates << make_inactivity_candidate(user, threshold) if threshold
      end
    end

    # Check if user missed their morning check-in for a specific family
    def missed_checkin_for_family?(user, family)
      timezone = family.timezone || "UTC"
      tz = Time.find_zone(timezone)
      now = tz.now
      today = now.to_date

      # Only check after the deadline hour
      return false unless now.hour >= MISSED_CHECKIN_DEADLINE_HOUR

      # Check if within quiet hours
      return false if within_quiet_hours?(user, now)

      # Check if user has daily plan for today with any content
      daily_plan = user.daily_plans.find_by(family: family, date: today)
      return true if daily_plan.nil?

      # If plan exists but has no tasks and no intention, consider it "missed"
      daily_plan.daily_tasks.empty? && daily_plan.intention.blank?
    end

    # Check if user missed their evening reflection for a specific family
    def missed_reflection_for_family?(user, family)
      timezone = family.timezone || "UTC"
      tz = Time.find_zone(timezone)
      now = tz.now
      today = now.to_date

      # Only check after the deadline hour
      return false unless now.hour >= MISSED_REFLECTION_DEADLINE_HOUR

      # Check if within quiet hours
      return false if within_quiet_hours?(user, now)

      # Find today's daily plan
      daily_plan = user.daily_plans.find_by(family: family, date: today)

      # If no daily plan, they didn't plan so no reflection expected
      return false if daily_plan.nil?

      # Check if there's no completed evening reflection for this plan
      evening_reflection = daily_plan.reflections.find_by(reflection_type: :evening)
      evening_reflection.nil? || !evening_reflection.completed?
    end

    private

    def morning_planning_users
      User.joins(:notification_preference)
          .where(notification_preferences: { morning_planning: true, reengagement_enabled: true })
          .includes(:families, :notification_preference, :daily_plans)
    end

    def evening_reflection_users
      User.joins(:notification_preference)
          .where(notification_preferences: { evening_reflection: true, reengagement_enabled: true })
          .includes(:families, :notification_preference, :daily_plans)
    end

    def reengagement_enabled_users
      User.joins(:notification_preference)
          .where(notification_preferences: { reengagement_enabled: true })
          .where.not(last_active_at: nil)
    end

    def collect_candidates_for_users(users)
      candidates = []
      users.find_each do |user|
        next if user.families.empty?

        user.families.each do |family|
          candidate = yield(user, family)
          if candidate
            candidates << candidate
            break
          end
        end
      end
      candidates
    end

    def make_candidate(user, reason, priority)
      OutreachCandidate.new(user: user, reason: reason, priority: priority)
    end

    def find_inactivity_threshold(user, sorted_thresholds)
      days_inactive = days_since_last_activity(user)
      return nil unless days_inactive

      sorted_thresholds.find { |t| days_inactive >= t }
    end

    def make_inactivity_candidate(user, threshold)
      priority = INACTIVITY_PRIORITIES.fetch(threshold, 7)
      OutreachCandidate.new(
        user: user,
        reason: :"inactive_#{threshold}_days",
        priority: priority
      )
    end

    def days_since_last_activity(user)
      return nil unless user.last_active_at

      ((Time.current - user.last_active_at) / 1.day).to_i
    end

    def within_quiet_hours?(user, time)
      preferences = user.notification_preference
      return false unless preferences

      preferences.within_quiet_hours?(time)
    end
  end
end
