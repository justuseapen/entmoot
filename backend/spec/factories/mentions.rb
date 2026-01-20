# frozen_string_literal: true

FactoryBot.define do
  factory :mention do
    association :user
    association :mentioned_user, factory: :user
    association :mentionable, factory: :goal
    text_field { "title" }

    trait :in_goal do
      association :mentionable, factory: :goal
      text_field { "title" }
    end

    trait :in_daily_plan do
      association :mentionable, factory: :daily_plan
      text_field { "shutdown_shipped" }
    end

    trait :in_weekly_review do
      association :mentionable, factory: :weekly_review
      text_field { "wins_shipped" }
    end
  end
end
