# frozen_string_literal: true

FactoryBot.define do
  factory :habit do
    user
    family
    name { Faker::Lorem.words(number: 2).join(" ").titleize }
    sequence(:position)
    is_active { true }

    trait :inactive do
      is_active { false }
    end
  end
end
