# frozen_string_literal: true

class AnnualReview < ApplicationRecord
  belongs_to :user
  belongs_to :family

  has_many :mentions, as: :mentionable, dependent: :destroy

  validates :year, presence: true
  validates :year, uniqueness: { scope: %i[user_id family_id], message: :already_exists_for_year }

  scope :for_year, ->(year) { where(year: year) }

  # Find or create the annual review for the current year
  def self.find_or_create_for_current_year(user:, family:)
    current_year = year_for(family)
    find_or_create_by(user: user, family: family, year: current_year)
  end

  # Get the current year in the family's timezone
  def self.year_for(family)
    timezone = Time.find_zone(family.timezone) || Time.zone
    timezone.today.year
  end

  # Get annual goals (time_scale: annual)
  def annual_goals
    Goal.where(family: family, time_scale: :annual)
        .where("creator_id = :user_id OR visibility = :family_vis",
               user_id: user.id, family_vis: Goal.visibilities[:family])
  end

  # Get quarterly reviews for this year
  def quarterly_reviews
    QuarterlyReview.where(user: user, family: family)
                   .where(quarter_start_date: year_start..year_end)
                   .order(:quarter_start_date)
  end

  # Get monthly reviews for this year
  def monthly_reviews
    MonthlyReview.where(user: user, family: family)
                 .where(month: year_start..year_end)
                 .order(:month)
  end

  # Get weekly reviews for this year
  def weekly_reviews
    WeeklyReview.where(user: user, family: family)
                .where(week_start_date: year_start..year_end)
                .order(:week_start_date)
  end

  # Calculate aggregate metrics for the year
  def metrics
    {
      goals_achieved: goals_achieved_metrics,
      streaks_maintained: streaks_maintained_metrics,
      review_consistency: review_consistency_metrics
    }
  end

  # Calculate goals achieved during the year
  def goals_achieved_metrics
    goals = annual_goals
    return default_goal_metrics if goals.empty?

    build_goal_metrics(goals)
  end

  # Calculate streaks maintained during the year
  def streaks_maintained_metrics
    user_streaks = user.streaks
    return default_streak_metrics if user_streaks.empty?

    build_streak_metrics(user_streaks)
  end

  # Calculate review consistency for the year
  def review_consistency_metrics
    quarterly_count = quarterly_reviews.where(completed: true).count
    monthly_count = monthly_reviews.where(completed: true).count
    weekly_count = weekly_reviews.where(completed: true).count

    build_review_consistency_metrics(quarterly_count, monthly_count, weekly_count)
  end

  private

  def year_start
    Date.new(year, 1, 1)
  end

  def year_end
    Date.new(year, 12, 31)
  end

  def weeks_in_year
    # Standard year has 52 weeks (some have 53)
    52
  end

  def build_goal_metrics(goals)
    {
      total_goals: goals.count,
      completed_goals: goals.where(status: :completed).count,
      in_progress_goals: goals.where(status: :in_progress).count,
      abandoned_goals: goals.where(status: :abandoned).count,
      average_progress: goals.average(:progress)&.round || 0
    }
  end

  def default_goal_metrics
    { total_goals: 0, completed_goals: 0, in_progress_goals: 0, abandoned_goals: 0, average_progress: 0 }
  end

  def default_streak_metrics
    { longest_daily_planning_streak: 0, longest_reflection_streak: 0, longest_weekly_review_streak: 0 }
  end

  def build_streak_metrics(streaks)
    {
      longest_daily_planning_streak: streaks.find_by(streak_type: :daily_planning)&.longest_count || 0,
      longest_reflection_streak: streaks.find_by(streak_type: :evening_reflection)&.longest_count || 0,
      longest_weekly_review_streak: streaks.find_by(streak_type: :weekly_review)&.longest_count || 0
    }
  end

  def build_review_consistency_metrics(quarterly_count, monthly_count, weekly_count)
    {
      quarterly_reviews_completed: quarterly_count,
      quarterly_reviews_total: 4,
      quarterly_completion_rate: calculate_completion_rate(quarterly_count, 4),
      monthly_reviews_completed: monthly_count,
      monthly_reviews_total: 12,
      monthly_completion_rate: calculate_completion_rate(monthly_count, 12),
      weekly_reviews_completed: weekly_count,
      weekly_reviews_total: weeks_in_year,
      weekly_completion_rate: calculate_completion_rate(weekly_count, weeks_in_year)
    }
  end

  def calculate_completion_rate(completed, total)
    return 0 unless total.positive?

    ((completed.to_f / total) * 100).round
  end
end
