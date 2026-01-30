# frozen_string_literal: true

FactoryBot.define do
  factory :top_priority do
    daily_plan
    title { Faker::Lorem.sentence(word_count: 3) }
    priority_order { 1 }

    trait :second do
      priority_order { 2 }
    end

    trait :third do
      priority_order { 3 }
    end
  end
end
