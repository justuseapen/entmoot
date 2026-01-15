# frozen_string_literal: true

class HabitCompletion < ApplicationRecord
  belongs_to :habit
  belongs_to :daily_plan

  validates :habit_id, uniqueness: { scope: :daily_plan_id }
end
