# frozen_string_literal: true

class PointsService
  class << self
    # Award points for completing a task
    def award_task_completion(user:, task: nil)
      award_points(user: user, activity_type: "complete_task", metadata: task_metadata(task))
    end

    # Award points for completing a daily plan (all tasks done)
    def award_daily_plan_completion(user:, daily_plan: nil)
      award_points(user: user, activity_type: "complete_daily_plan", metadata: daily_plan_metadata(daily_plan))
    end

    # Award points for completing a reflection
    def award_reflection_completion(user:, reflection: nil)
      award_points(user: user, activity_type: "complete_reflection", metadata: reflection_metadata(reflection))
    end

    # Award points for completing a weekly review
    def award_weekly_review_completion(user:, weekly_review: nil)
      award_points(user: user, activity_type: "complete_weekly_review", metadata: weekly_review_metadata(weekly_review))
    end

    # Award points for creating a goal
    def award_goal_creation(user:, goal: nil)
      award_points(user: user, activity_type: "create_goal", metadata: goal_metadata(goal))
    end

    # Award points for completing a goal
    def award_goal_completion(user:, goal: nil)
      award_points(user: user, activity_type: "complete_goal", metadata: goal_metadata(goal))
    end

    # Award points for earning a badge
    def award_badge_earned(user:, badge: nil)
      award_points(user: user, activity_type: "earn_badge", metadata: badge_metadata(badge))
    end

    # Award points for reaching a streak milestone
    def award_streak_milestone(user:, streak: nil, milestone: nil)
      award_points(
        user: user,
        activity_type: "streak_milestone",
        metadata: streak_milestone_metadata(streak, milestone)
      )
    end

    # Get total points for a user
    def total_points(user)
      PointsLedgerEntry.total_for_user(user)
    end

    # Get weekly points for a user
    def weekly_points(user)
      PointsLedgerEntry.total_this_week_for_user(user)
    end

    # Get recent activity for a user
    def recent_activity(user, limit: 20)
      PointsLedgerEntry.where(user: user).recent.limit(limit)
    end

    # Get points breakdown by activity type
    def points_breakdown(user)
      PointsLedgerEntry.where(user: user)
                       .group(:activity_type)
                       .sum(:points)
    end

    private

    def award_points(user:, activity_type:, metadata: {})
      points = PointsLedgerEntry.points_for(activity_type)
      return nil if points.zero?

      PointsLedgerEntry.create!(
        user: user,
        points: points,
        activity_type: activity_type,
        metadata: metadata.compact
      )
    end

    def task_metadata(task)
      return {} unless task

      { task_id: task.id, task_title: task.title }
    end

    def daily_plan_metadata(daily_plan)
      return {} unless daily_plan

      { daily_plan_id: daily_plan.id, date: daily_plan.date.to_s }
    end

    def reflection_metadata(reflection)
      return {} unless reflection

      { reflection_id: reflection.id, reflection_type: reflection.reflection_type }
    end

    def weekly_review_metadata(weekly_review)
      return {} unless weekly_review

      { weekly_review_id: weekly_review.id, week_start_date: weekly_review.week_start_date.to_s }
    end

    def goal_metadata(goal)
      return {} unless goal

      { goal_id: goal.id, goal_title: goal.title, time_scale: goal.time_scale }
    end

    def badge_metadata(badge)
      return {} unless badge

      { badge_id: badge.id, badge_name: badge.name }
    end

    def streak_milestone_metadata(streak, milestone)
      metadata = {}
      metadata[:streak_id] = streak.id if streak
      metadata[:streak_type] = streak.streak_type if streak
      metadata[:milestone] = milestone if milestone
      metadata
    end
  end
end
