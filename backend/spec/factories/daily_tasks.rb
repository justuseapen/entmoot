# frozen_string_literal: true

FactoryBot.define do
  factory :daily_task do
    daily_plan
    title { Faker::Lorem.sentence(word_count: 3) }
    completed { false }
    sequence(:position)

    trait :completed do
      completed { true }
    end

    trait :incomplete do
      completed { false }
    end

    trait :first_position do
      position { 0 }
    end
  end
end
