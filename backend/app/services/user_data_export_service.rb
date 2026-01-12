# frozen_string_literal: true

class UserDataExportService
  def self.export(user)
    new(user).export
  end

  def initialize(user)
    @user = user
  end

  def export
    {
      exported_at: Time.current.iso8601,
      user: user_data,
      families: families_data,
      goals: goals_data,
      daily_plans: daily_plans_data,
      reflections: reflections_data,
      weekly_reviews: weekly_reviews_data,
      streaks: streaks_data,
      badges: badges_data,
      points: points_data,
      notifications: notifications_data,
      notification_preferences: notification_preferences_data
    }
  end

  private

  def user_data
    { id: @user.id, email: @user.email, name: @user.name, avatar_url: @user.avatar_url,
      created_at: @user.created_at.iso8601, updated_at: @user.updated_at.iso8601 }
  end

  def families_data
    @user.family_memberships.includes(:family).map do |membership|
      { family_id: membership.family_id, family_name: membership.family.name,
        role: membership.role, joined_at: membership.created_at.iso8601 }
    end
  end

  def goals_data
    @user.created_goals.map { |goal| goal_to_hash(goal) }
  end

  def goal_to_hash(goal)
    { id: goal.id, title: goal.title, description: goal.description, specific: goal.specific,
      measurable: goal.measurable, achievable: goal.achievable, relevant: goal.relevant,
      time_bound: goal.time_bound, time_scale: goal.time_scale, status: goal.status,
      visibility: goal.visibility, progress: goal.progress, due_date: goal.due_date&.iso8601,
      created_at: goal.created_at.iso8601 }
  end

  def daily_plans_data
    @user.daily_plans.includes(:daily_tasks, :top_priorities).map { |plan| daily_plan_to_hash(plan) }
  end

  def daily_plan_to_hash(plan)
    {
      id: plan.id, date: plan.date.iso8601, intention: plan.intention,
      tasks: plan.daily_tasks.map { |t| { title: t.title, completed: t.completed } },
      priorities: plan.top_priorities.map { |p| { title: p.title, order: p.priority_order } },
      created_at: plan.created_at.iso8601
    }
  end

  def reflections_data
    Reflection.joins(:daily_plan).where(daily_plans: { user_id: @user.id })
              .includes(:reflection_responses).map { |r| reflection_to_hash(r) }
  end

  def reflection_to_hash(reflection)
    {
      id: reflection.id, reflection_type: reflection.reflection_type,
      mood: reflection.mood, energy_level: reflection.energy_level, gratitude_items: reflection.gratitude_items,
      responses: reflection.reflection_responses.map { |r| { prompt: r.prompt, response: r.response } },
      created_at: reflection.created_at.iso8601
    }
  end

  def weekly_reviews_data
    @user.weekly_reviews.map { |review| weekly_review_to_hash(review) }
  end

  def weekly_review_to_hash(review)
    { id: review.id, week_start_date: review.week_start_date.iso8601, wins: review.wins,
      challenges: review.challenges, lessons_learned: review.lessons_learned,
      next_week_priorities: review.next_week_priorities, completed: review.completed,
      created_at: review.created_at.iso8601 }
  end

  def streaks_data
    @user.streaks.map { |streak| streak_to_hash(streak) }
  end

  def streak_to_hash(streak)
    { streak_type: streak.streak_type, current_count: streak.current_count,
      longest_count: streak.longest_count, last_activity_date: streak.last_activity_date&.iso8601 }
  end

  def badges_data
    @user.user_badges.includes(:badge).map { |ub| user_badge_to_hash(ub) }
  end

  def user_badge_to_hash(user_badge)
    { badge_name: user_badge.badge.name, badge_description: user_badge.badge.description,
      earned_at: user_badge.earned_at.iso8601 }
  end

  def points_data
    { total: @user.total_points, entries: points_entries }
  end

  def points_entries
    @user.points_ledger_entries.order(created_at: :desc).limit(100).map { |entry| points_entry_to_hash(entry) }
  end

  def points_entry_to_hash(entry)
    { points: entry.points, activity_type: entry.activity_type, created_at: entry.created_at.iso8601 }
  end

  def notifications_data
    @user.notifications.order(created_at: :desc).limit(100).map { |n| notification_to_hash(n) }
  end

  def notification_to_hash(notification)
    { title: notification.title, body: notification.body, notification_type: notification.notification_type,
      read: notification.read, created_at: notification.created_at.iso8601 }
  end

  def notification_preferences_data
    pref = @user.notification_preference
    return {} unless pref

    { channels: pref_channels(pref), reminders: pref_reminders(pref), quiet_hours: pref_quiet_hours(pref) }
  end

  def pref_channels(pref)
    { in_app: pref.in_app, email: pref.email, push: pref.push }
  end

  def pref_reminders(pref)
    {
      morning_planning: { enabled: pref.morning_planning, time: pref.morning_planning_time },
      evening_reflection: { enabled: pref.evening_reflection, time: pref.evening_reflection_time },
      weekly_review: { enabled: pref.weekly_review, time: pref.weekly_review_time, day: pref.weekly_review_day }
    }
  end

  def pref_quiet_hours(pref)
    { start: pref.quiet_hours_start, end: pref.quiet_hours_end }
  end
end
