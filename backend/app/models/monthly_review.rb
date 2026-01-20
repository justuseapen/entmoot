# frozen_string_literal: true

class MonthlyReview < ApplicationRecord
  include Mentionable

  belongs_to :user
  belongs_to :family

  # Mentions association is provided by the Mentionable concern
  mentionable_fields :lessons_learned

  validates :month, presence: true
  validates :month, uniqueness: { scope: %i[user_id family_id], message: :already_exists_for_month }

  scope :for_month, ->(date) { where(month: date) }

  # Find or create the monthly review for the current month
  def self.find_or_create_for_current_month(user:, family:)
    month_start = month_start_date_for(family)
    find_or_create_by(user: user, family: family, month: month_start)
  end

  # Calculate the start of the current month (first day of month in family timezone)
  def self.month_start_date_for(family)
    timezone = Time.find_zone(family.timezone) || Time.zone
    timezone.today.beginning_of_month
  end

  # Get weekly reviews for this month
  def weekly_reviews
    month_end = month + 1.month - 1.day
    WeeklyReview.where(user: user, family: family, week_start_date: month..month_end).order(:week_start_date)
  end

  # Get daily plans for this month
  def daily_plans
    month_end = month + 1.month - 1.day
    DailyPlan.where(user: user, family: family, date: month..month_end).order(:date)
  end

  # Get reflections for this month
  def reflections
    month_end = month + 1.month - 1.day
    Reflection.where(user: user, family: family, created_at: month.beginning_of_day..month_end.end_of_day)
              .order(:created_at)
  end

  # Calculate aggregate metrics for the month
  def metrics
    {
      task_completion: task_completion_metrics,
      goal_progress: goal_progress_metrics,
      reflection_consistency: reflection_consistency_metrics
    }
  end

  # Aggregate task completion rate for the month
  def task_completion_metrics
    plans = daily_plans.includes(:daily_tasks)
    return default_task_metrics if plans.empty?

    aggregate_task_stats(plans)
  end

  # Aggregate goals progress changes for the month
  def goal_progress_metrics
    goals = visible_goals
    return default_goal_metrics if goals.empty?

    build_goal_metrics(goals)
  end

  # Calculate reflection consistency for the month
  def reflection_consistency_metrics
    total_days = days_in_month
    reflection_count = reflections.count
    {
      total_days: total_days,
      reflections_completed: reflection_count,
      consistency_rate: ((reflection_count.to_f / total_days) * 100).round
    }
  end

  private

  def days_in_month
    Time.days_in_month(month.month, month.year)
  end

  def aggregate_task_stats(plans)
    totals = compute_task_totals(plans)
    completion_rate = calculate_completion_rate(totals[:completed], totals[:total])

    {
      total_tasks: totals[:total],
      completed_tasks: totals[:completed],
      completion_rate: completion_rate,
      days_with_plans: totals[:days]
    }
  end

  def compute_task_totals(plans)
    total = 0
    completed = 0
    days = 0

    plans.each do |plan|
      day_total = plan.daily_tasks.count
      completed += plan.daily_tasks.where(completed: true).count
      total += day_total
      days += 1 if day_total.positive?
    end

    { total: total, completed: completed, days: days }
  end

  def calculate_completion_rate(completed, total)
    total.positive? ? ((completed.to_f / total) * 100).round : 0
  end

  def visible_goals
    family_visibility = Goal.visibilities[:family]
    Goal.where(family: family)
        .where("creator_id = :user_id OR visibility = :family_vis", user_id: user.id, family_vis: family_visibility)
  end

  def build_goal_metrics(goals)
    {
      total_goals: goals.count,
      completed_goals: goals.where(status: :completed).count,
      in_progress_goals: goals.where(status: :in_progress).count,
      at_risk_goals: goals.where(status: :at_risk).count,
      average_progress: goals.average(:progress)&.round || 0
    }
  end

  def default_task_metrics
    { total_tasks: 0, completed_tasks: 0, completion_rate: 0, days_with_plans: 0 }
  end

  def default_goal_metrics
    { total_goals: 0, completed_goals: 0, in_progress_goals: 0, at_risk_goals: 0, average_progress: 0 }
  end
end
