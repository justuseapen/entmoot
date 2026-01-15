# frozen_string_literal: true

class DailyPlan < ApplicationRecord
  belongs_to :user
  belongs_to :family

  has_many :daily_tasks, -> { order(:position) }, dependent: :destroy, inverse_of: :daily_plan
  has_many :top_priorities, -> { order(:priority_order) }, dependent: :destroy, inverse_of: :daily_plan
  has_many :reflections, dependent: :destroy
  has_many :habit_completions, dependent: :destroy

  validates :date, presence: true
  validates :date, uniqueness: { scope: %i[user_id family_id], message: :already_exists_for_date }

  accepts_nested_attributes_for :daily_tasks, allow_destroy: true
  accepts_nested_attributes_for :top_priorities, allow_destroy: true
  accepts_nested_attributes_for :habit_completions

  scope :for_date, ->(date) { where(date: date) }

  def self.find_or_create_for_today(user:, family:)
    today = Time.find_zone(family.timezone)&.today || Time.zone.today
    daily_plan = find_or_create_by(user: user, family: family, date: today)
    HabitInitializerService.initialize_habits_for(user: user, family: family)
    daily_plan
  end

  def yesterday_incomplete_tasks
    yesterday_plan = DailyPlan.find_by(user: user, family: family, date: date - 1.day)
    return [] unless yesterday_plan

    yesterday_plan.daily_tasks.where(completed: false).order(:position)
  end

  def completion_stats
    total = daily_tasks.count
    completed = daily_tasks.where(completed: true).count
    {
      total: total,
      completed: completed,
      percentage: total.positive? ? ((completed.to_f / total) * 100).round : 0
    }
  end
end
