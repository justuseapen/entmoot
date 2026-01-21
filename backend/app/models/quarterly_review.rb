# frozen_string_literal: true

class QuarterlyReview < ApplicationRecord
  include Mentionable

  belongs_to :user
  belongs_to :family

  # Mentions association is provided by the Mentionable concern
  mentionable_fields :insights

  validates :quarter_start_date, presence: true
  validates :quarter_start_date, uniqueness: { scope: %i[user_id family_id], message: :already_exists_for_quarter }

  scope :for_quarter, ->(date) { where(quarter_start_date: date) }
  scope :mentioned_by, lambda { |user_id|
    joins(:mentions).where(mentions: { mentioned_user_id: user_id }).distinct if user_id.present?
  }

  # Quarter start dates: Q1=Jan 1, Q2=Apr 1, Q3=Jul 1, Q4=Oct 1
  QUARTER_START_MONTHS = [1, 4, 7, 10].freeze

  # Find or create the quarterly review for the current quarter
  def self.find_or_create_for_current_quarter(user:, family:)
    quarter_start = quarter_start_date_for(family)
    find_or_create_by(user: user, family: family, quarter_start_date: quarter_start)
  end

  # Calculate the start of the current quarter (first day of quarter in family timezone)
  def self.quarter_start_date_for(family)
    timezone = Time.find_zone(family.timezone) || Time.zone
    today = timezone.today
    quarter_month = QUARTER_START_MONTHS.reverse.find { |m| m <= today.month }
    Date.new(today.year, quarter_month, 1)
  end

  # Get quarterly goals (time_scale: quarterly)
  def quarterly_goals
    Goal.where(family: family, time_scale: :quarterly)
        .where("creator_id = :user_id OR visibility = :family_vis",
               user_id: user.id, family_vis: Goal.visibilities[:family])
  end

  # Get monthly reviews for this quarter
  def monthly_reviews
    quarter_end = quarter_end_date
    MonthlyReview.where(user: user, family: family, month: quarter_start_date..quarter_end)
                 .order(:month)
  end

  # Get weekly reviews for this quarter
  def weekly_reviews
    quarter_end = quarter_end_date
    WeeklyReview.where(user: user, family: family, week_start_date: quarter_start_date..quarter_end)
                .order(:week_start_date)
  end

  # Calculate aggregate metrics for the quarter
  def metrics
    {
      goal_completion: goal_completion_metrics,
      monthly_review_completion: monthly_review_metrics,
      habit_consistency: habit_consistency_metrics
    }
  end

  # Calculate goal completion rate for the quarter
  def goal_completion_metrics
    goals = quarterly_goals
    return default_goal_metrics if goals.empty?

    build_goal_metrics(goals)
  end

  # Calculate monthly review completion for the quarter
  def monthly_review_metrics
    reviews = monthly_reviews
    months_in_quarter = 3
    completed_count = reviews.where(completed: true).count

    {
      total_months: months_in_quarter,
      completed_reviews: completed_count,
      completion_rate: ((completed_count.to_f / months_in_quarter) * 100).round
    }
  end

  # Calculate habit consistency (weekly review completion)
  def habit_consistency_metrics
    reviews = weekly_reviews
    total_weeks = weeks_in_quarter
    completed_count = reviews.where(completed: true).count

    {
      total_weeks: total_weeks,
      completed_weekly_reviews: completed_count,
      consistency_rate: total_weeks.positive? ? ((completed_count.to_f / total_weeks) * 100).round : 0
    }
  end

  private

  def quarter_end_date
    quarter_start_date + 3.months - 1.day
  end

  def weeks_in_quarter
    # Approximate weeks in a quarter (13 weeks)
    13
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

  def default_goal_metrics
    { total_goals: 0, completed_goals: 0, in_progress_goals: 0, at_risk_goals: 0, average_progress: 0 }
  end
end
