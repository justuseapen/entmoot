# frozen_string_literal: true

FactoryBot.define do
  factory :user_badge do
    user
    badge
    earned_at { Time.current }

    trait :recent do
      earned_at { 1.day.ago }
    end

    trait :old do
      earned_at { 30.days.ago }
    end
  end
end
