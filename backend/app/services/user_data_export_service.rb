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
      daily_plans: daily_plans_data,
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
      morning_planning: { enabled: pref.morning_planning, time: pref.morning_planning_time }
    }
  end

  def pref_quiet_hours(pref)
    { start: pref.quiet_hours_start, end: pref.quiet_hours_end }
  end
end
