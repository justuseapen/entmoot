# frozen_string_literal: true

class ActivityFeedService
  ACTIVITY_TYPES = %w[goal_created goal_completed badge_earned streak_milestone reflection_completed].freeze
  DEFAULT_LIMIT = 10
  LOOKBACK_PERIOD = 7.days

  class << self
    def get_family_activity(family, limit: DEFAULT_LIMIT)
      user_ids = family.family_memberships.pluck(:user_id)

      activities = []
      activities.concat(goal_activities(family, limit))
      activities.concat(badge_activities(user_ids, limit))
      activities.concat(streak_activities(user_ids, limit))
      activities.concat(reflection_activities(family, user_ids, limit))

      activities.sort_by { |a| -a[:timestamp].to_i }.first(limit)
    end

    private

    def goal_activities(family, limit)
      created_goal_activities(family, limit) + completed_goal_activities(family, limit)
    end

    def created_goal_activities(family, limit)
      recent_goals_query(family, limit).map do |goal|
        build_goal_activity(goal, "goal_created", "created a new goal:", goal.created_at)
      end
    end

    def completed_goal_activities(family, limit)
      completed_goals_query(family, limit).map do |goal|
        build_goal_activity(goal, "goal_completed", "completed goal:", goal.updated_at)
      end
    end

    def recent_goals_query(family, limit)
      family.goals
            .where(visibility: :family, created_at: LOOKBACK_PERIOD.ago..)
            .includes(:creator)
            .order(created_at: :desc)
            .limit(limit)
    end

    def completed_goals_query(family, limit)
      family.goals
            .where(status: :completed, visibility: :family, updated_at: LOOKBACK_PERIOD.ago..)
            .includes(:creator)
            .order(updated_at: :desc)
            .limit(limit)
    end

    def build_goal_activity(goal, type, prefix, timestamp)
      build_activity(
        type: type,
        user: goal.creator,
        description: "#{prefix} #{goal.title}",
        timestamp: timestamp,
        metadata: { goal_id: goal.id, goal_title: goal.title }
      )
    end

    def badge_activities(user_ids, limit)
      badge_query(user_ids, limit).map { |ub| build_badge_activity(ub) }
    end

    def badge_query(user_ids, limit)
      UserBadge
        .where(user_id: user_ids, earned_at: LOOKBACK_PERIOD.ago..)
        .includes(:user, :badge)
        .order(earned_at: :desc)
        .limit(limit)
    end

    def build_badge_activity(user_badge)
      build_activity(
        type: "badge_earned",
        user: user_badge.user,
        description: "earned the #{user_badge.badge.name} badge",
        timestamp: user_badge.earned_at,
        metadata: badge_metadata(user_badge)
      )
    end

    def badge_metadata(user_badge)
      { badge_id: user_badge.badge_id, badge_name: user_badge.badge.name, badge_icon: user_badge.badge.icon }
    end

    def streak_activities(user_ids, limit)
      streak_query(user_ids, limit).map { |entry| build_streak_activity(entry) }
    end

    def streak_query(user_ids, limit)
      PointsLedgerEntry
        .where(user_id: user_ids, activity_type: :streak_milestone, created_at: LOOKBACK_PERIOD.ago..)
        .includes(:user)
        .order(created_at: :desc)
        .limit(limit)
    end

    def build_streak_activity(entry)
      streak_type = entry.metadata["streak_type"] || "streak"
      days = entry.metadata["days"] || 0

      build_activity(
        type: "streak_milestone",
        user: entry.user,
        description: "reached a #{days}-day #{streak_type.humanize.downcase} streak!",
        timestamp: entry.created_at,
        metadata: entry.metadata
      )
    end

    def reflection_activities(family, user_ids, limit)
      reflection_query(family, user_ids, limit).map { |r| build_reflection_activity(r) }
    end

    def reflection_query(family, user_ids, limit)
      Reflection
        .joins(:daily_plan, :reflection_responses)
        .where(daily_plans: { family_id: family.id, user_id: user_ids })
        .where(reflection_type: :evening, reflections: { created_at: LOOKBACK_PERIOD.ago.. })
        .where("reflection_responses.response IS NOT NULL AND reflection_responses.response != ''")
        .includes(daily_plan: :user)
        .distinct
        .order("reflections.created_at DESC")
        .limit(limit)
    end

    def build_reflection_activity(reflection)
      build_activity(
        type: "reflection_completed",
        user: reflection.daily_plan.user,
        description: "completed their evening reflection",
        timestamp: reflection.created_at,
        metadata: { reflection_id: reflection.id }
      )
    end

    def build_activity(type:, user:, description:, timestamp:, metadata: {})
      {
        type: type,
        user: { id: user.id, name: user.name, avatar_url: user.avatar_url },
        description: description,
        timestamp: timestamp,
        metadata: metadata
      }
    end
  end
end
