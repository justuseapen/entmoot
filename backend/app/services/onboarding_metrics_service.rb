# frozen_string_literal: true

class OnboardingMetricsService
  def initialize(start_date: nil, end_date: nil)
    @start_date = start_date || 30.days.ago.beginning_of_day
    @end_date = end_date || Time.current.end_of_day
  end

  def metrics
    {
      date_range: date_range_info,
      summary: summary_metrics,
      derived_metrics: derived_metrics,
      funnel: funnel_metrics
    }
  end

  private

  attr_reader :start_date, :end_date

  def date_range_info
    {
      start_date: start_date.to_date,
      end_date: end_date.to_date
    }
  end

  def users_in_range
    @users_in_range ||= User.where(created_at: start_date..end_date)
  end

  def total_users
    @total_users ||= users_in_range.count
  end

  def summary_metrics
    {
      total_signups: total_users,
      wizard_completions: wizard_completion_count,
      tour_completions: tour_completion_count,
      first_goals: first_goal_count,
      first_reflections: first_reflection_count,
      first_invites: first_invite_count
    }
  end

  def wizard_completion_count
    users_in_range.where.not(onboarding_wizard_completed_at: nil).count
  end

  def tour_completion_count
    users_in_range.where.not(tour_completed_at: nil).count
  end

  def first_goal_count
    users_in_range.where.not(first_goal_created_at: nil).count
  end

  def first_reflection_count
    users_in_range.where.not(first_reflection_created_at: nil).count
  end

  def first_invite_count
    users_in_range.where.not(first_family_invite_sent_at: nil).count
  end

  def derived_metrics
    {
      wizard_completion_rate: percentage(wizard_completion_count, total_users),
      tour_completion_rate: percentage(tour_completion_count, total_users),
      day_7_retention: day_7_retention_rate,
      avg_time_to_first_goal_hours: avg_time_to_first_goal,
      avg_time_to_first_reflection_hours: avg_time_to_first_reflection
    }
  end

  def day_7_retention_rate
    # Users who signed up at least 7 days ago and performed an action in days 6-8
    eligible_users = users_in_range.where(created_at: ..7.days.ago)
    return nil if eligible_users.empty?

    retained_count = eligible_users.count do |user|
      active_day_7?(user)
    end

    percentage(retained_count, eligible_users.count)
  end

  def active_day_7?(user)
    day_7_start = user.created_at + 6.days
    day_7_end = user.created_at + 9.days

    user_had_activity_in_range?(user, day_7_start, day_7_end)
  end

  def user_had_activity_in_range?(user, range_start, range_end)
    user.daily_plans.exists?(created_at: range_start..range_end) ||
      user.reflections.exists?(created_at: range_start..range_end) ||
      user.weekly_reviews.exists?(created_at: range_start..range_end) ||
      user.created_goals.exists?(created_at: range_start..range_end)
  end

  def avg_time_to_first_goal
    users_with_goal = users_in_range.where.not(first_goal_created_at: nil)
    return nil if users_with_goal.empty?

    total_hours = users_with_goal.sum do |user|
      ((user.first_goal_created_at - user.created_at) / 1.hour).round(1)
    end

    (total_hours / users_with_goal.count).round(1)
  end

  def avg_time_to_first_reflection
    users_with_reflection = users_in_range.where.not(first_reflection_created_at: nil)
    return nil if users_with_reflection.empty?

    total_hours = users_with_reflection.sum do |user|
      ((user.first_reflection_created_at - user.created_at) / 1.hour).round(1)
    end

    (total_hours / users_with_reflection.count).round(1)
  end

  def funnel_metrics
    {
      signup_to_wizard: percentage(wizard_completion_count, total_users),
      wizard_to_first_goal: percentage(first_goal_count, wizard_completion_count),
      first_goal_to_first_reflection: percentage(first_reflection_count, first_goal_count),
      first_reflection_to_first_invite: percentage(first_invite_count, first_reflection_count)
    }
  end

  def percentage(numerator, denominator)
    return nil if denominator.nil? || denominator.zero?

    ((numerator.to_f / denominator) * 100).round(1)
  end
end
