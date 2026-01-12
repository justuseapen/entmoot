# frozen_string_literal: true

class BadgeService
  # Badge identifiers matching the seeded badges
  BADGES = {
    first_goal: "first_goal",
    goal_setter: "goal_setter",
    goal_master: "goal_master",
    first_reflection: "first_reflection",
    reflection_pro: "reflection_pro",
    first_plan: "first_plan",
    planning_pro: "planning_pro",
    week_warrior: "week_warrior",
    month_champion: "month_champion",
    consistency_king: "consistency_king"
  }.freeze

  class << self
    # Check and award all eligible badges for a user
    def check_all_badges(user)
      awarded = []

      Badge.find_each do |badge|
        next if badge.earned_by?(user)

        if eligible_for_badge?(user, badge)
          award_badge(user, badge)
          awarded << badge
        end
      end

      awarded
    end

    # Check specific badge categories for a user
    def check_goal_badges(user)
      check_badges_in_category(user, "goals")
    end

    def check_planning_badges(user)
      check_badges_in_category(user, "planning")
    end

    def check_reflection_badges(user)
      check_badges_in_category(user, "reflection")
    end

    def check_streak_badges(user)
      check_badges_in_category(user, "streaks")
    end

    # Award a specific badge to a user
    def award_badge(user, badge)
      return nil if badge.earned_by?(user)

      user_badge = UserBadge.create!(user: user, badge: badge)
      NotificationService.notify_badge_earned(user: user, badge_name: badge.name)
      PointsService.award_badge_earned(user: user, badge: badge)

      user_badge
    end

    # Get all badges for a user (earned and unearned)
    def badges_for_user(user)
      Badge.all.map do |badge|
        user_badge = user.user_badges.find_by(badge: badge)
        {
          badge: badge,
          earned: user_badge.present?,
          earned_at: user_badge&.earned_at
        }
      end
    end

    private

    def check_badges_in_category(user, category)
      awarded = []

      Badge.by_category(category).find_each do |badge|
        next if badge.earned_by?(user)

        if eligible_for_badge?(user, badge)
          award_badge(user, badge)
          awarded << badge
        end
      end

      awarded
    end

    def eligible_for_badge?(user, badge)
      check_method = "#{badge.name}_eligible?"

      if respond_to?(check_method, true)
        send(check_method, user, badge)
      else
        generic_eligible?(user, badge)
      end
    end

    # Generic eligibility check using badge criteria
    def generic_eligible?(user, badge)
      criteria_type = badge.criterion_value("type")

      case criteria_type
      when "goal_count"
        user.created_goals.count >= badge.criterion_value("count")
      when "reflection_count"
        reflection_count(user) >= badge.criterion_value("count")
      when "daily_plan_count"
        daily_plan_count(user) >= badge.criterion_value("count")
      when "streak_days"
        max_streak_days(user) >= badge.criterion_value("days")
      else
        false
      end
    end

    # Specific eligibility checks for each badge

    def first_goal_eligible?(user, _badge)
      user.created_goals.exists?
    end

    def goal_setter_eligible?(user, _badge)
      user.created_goals.count >= 5
    end

    def goal_master_eligible?(user, _badge)
      user.created_goals.count >= 25
    end

    def first_reflection_eligible?(user, _badge)
      user_has_reflection?(user)
    end

    def reflection_pro_eligible?(user, _badge)
      reflection_count(user) >= 10
    end

    def first_plan_eligible?(user, _badge)
      user_has_daily_plan?(user)
    end

    def planning_pro_eligible?(user, _badge)
      daily_plan_count(user) >= 10
    end

    def week_warrior_eligible?(user, _badge)
      max_streak_days(user) >= 7
    end

    def month_champion_eligible?(user, _badge)
      max_streak_days(user) >= 30
    end

    def consistency_king_eligible?(user, _badge)
      max_streak_days(user) >= 90
    end

    # Helper methods

    def user_has_reflection?(user)
      Reflection.joins(:daily_plan).exists?(daily_plans: { user_id: user.id })
    end

    def reflection_count(user)
      Reflection.joins(:daily_plan).where(daily_plans: { user_id: user.id }).count
    end

    def user_has_daily_plan?(user)
      user.daily_plans.joins(:daily_tasks).exists?
    end

    def daily_plan_count(user)
      user.daily_plans.joins(:daily_tasks).distinct.count
    end

    def max_streak_days(user)
      user.streaks.maximum(:longest_count) || 0
    end
  end
end
