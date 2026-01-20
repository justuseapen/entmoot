# frozen_string_literal: true

class WeeklyReview < ApplicationRecord
  include Mentionable

  belongs_to :user
  belongs_to :family

  # Mentions association is provided by the Mentionable concern
  mentionable_fields :wins_shipped, :losses_friction, :metrics_notes, :system_to_adjust, :weekly_priorities, :kill_list

  validates :week_start_date, presence: true
  validates :week_start_date, uniqueness: { scope: %i[user_id family_id], message: :already_exists_for_week }

  scope :for_week, ->(date) { where(week_start_date: date) }
  scope :mentioned_by, lambda { |user_id|
    joins(:mentions).where(mentions: { mentioned_user_id: user_id }).distinct if user_id.present?
  }

  # Find or create the weekly review for the current week
  def self.find_or_create_for_current_week(user:, family:)
    week_start = week_start_date_for(family)
    find_or_create_by(user: user, family: family, week_start_date: week_start)
  end

  # Calculate the start of the current week (default Monday, configurable per family)
  def self.week_start_date_for(family)
    timezone = Time.find_zone(family.timezone) || Time.zone
    today = timezone.today

    # Get week start day from family settings (default to Monday = 1)
    week_start_day = family.settings&.dig("week_start_day") || 1

    # Calculate days since the start of the week
    days_since_start = (today.wday - week_start_day) % 7
    today - days_since_start.days
  end

  # Get daily plans for this week
  def daily_plans
    week_end = week_start_date + 6.days
    DailyPlan.where(user: user, family: family, date: week_start_date..week_end).order(:date)
  end

  # Calculate aggregate metrics for the week
  def metrics
    {
      task_completion: task_completion_metrics,
      goal_progress: goal_progress_metrics
    }
  end

  # Aggregate task completion rate for the week
  def task_completion_metrics
    plans = daily_plans.includes(:daily_tasks)
    return default_task_metrics if plans.empty?

    aggregate_task_stats(plans)
  end

  # Tally habit completions by habit name across the week
  # Returns a hash like { "Workout" => 3, "Walk" => 5, "Writing" => 2, "House Reset" => 7 }
  def habit_tally
    plans = daily_plans.includes(habit_completions: :habit)
    tally = Hash.new(0)

    plans.each do |plan|
      plan.habit_completions.where(completed: true).find_each do |completion|
        habit_name = completion.habit.name
        tally[habit_name] += 1
      end
    end

    tally
  end

  # Aggregate goals progress changes for the week
  def goal_progress_metrics
    goals = visible_goals
    return default_goal_metrics if goals.empty?

    build_goal_metrics(goals)
  end

  private

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
