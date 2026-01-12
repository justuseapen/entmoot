# frozen_string_literal: true

class StreakService
  MILESTONE_THRESHOLDS = Streak::MILESTONE_THRESHOLDS

  class << self
    # Record daily planning activity and update streak
    def record_daily_planning(user:, date: nil)
      record_activity(user: user, streak_type: :daily_planning, date: date)
    end

    # Record evening reflection activity and update streak
    def record_evening_reflection(user:, date: nil)
      record_activity(user: user, streak_type: :evening_reflection, date: date)
    end

    # Record weekly review activity and update streak
    def record_weekly_review(user:, date: nil)
      record_activity(user: user, streak_type: :weekly_review, date: date)
    end

    # Get all streaks for a user, creating missing ones
    def get_all_streaks(user)
      Streak.streak_types.keys.map do |streak_type|
        Streak.find_or_create_for(user: user, streak_type: streak_type)
      end
    end

    # Check and reset broken streaks for a user
    def check_and_reset_broken_streaks(user, current_date: nil)
      current_date ||= Time.zone.today
      user.streaks.each do |streak|
        reset_if_broken(streak, current_date)
      end
    end

    private

    def record_activity(user:, streak_type:, date: nil)
      date ||= activity_date_for(user, streak_type)
      streak = Streak.find_or_create_for(user: user, streak_type: streak_type)

      was_recorded = streak.record_activity!(date)

      notify_milestone(user, streak) if was_recorded && streak.milestone_reached?

      streak
    end

    def activity_date_for(user, _streak_type)
      # Use user's family timezone if available, otherwise system timezone
      timezone = user_timezone(user)
      timezone&.today || Time.zone.today
    end

    def user_timezone(user)
      # Get the first family's timezone if user belongs to any family
      first_family = user.families.first
      return nil unless first_family

      Time.find_zone(first_family.timezone)
    end

    def reset_if_broken(streak, current_date)
      return unless streak.broken?(current_date)

      streak.update!(current_count: 0)
    end

    def notify_milestone(user, streak)
      NotificationService.notify_streak_milestone(
        user: user,
        streak_type: streak.streak_type,
        count: streak.current_count
      )
    end
  end
end
