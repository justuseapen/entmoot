# frozen_string_literal: true

FactoryBot.define do
  factory :habit_completion do
    habit
    daily_plan
    completed { false }

    trait :completed do
      completed { true }
    end
  end
end
