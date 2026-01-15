# frozen_string_literal: true

class HabitInitializerService
  DEFAULT_HABITS = [
    "Prayer AM",
    "Bible Study",
    "Planning",
    "Workout",
    "Walk",
    "Writing",
    "Reading",
    "House Reset",
    "Prayer PM"
  ].freeze

  class << self
    def initialize_habits_for(user:, family:)
      return if user.habits.exists?(family: family)

      DEFAULT_HABITS.each_with_index do |habit_name, index|
        Habit.create!(
          user: user,
          family: family,
          name: habit_name,
          position: index + 1,
          is_active: true
        )
      end
    end
  end
end
