# frozen_string_literal: true

FactoryBot.define do
  factory :streak do
    user
    streak_type { :daily_planning }
    current_count { 0 }
    longest_count { 0 }
    last_activity_date { nil }

    trait :daily_planning do
      streak_type { :daily_planning }
    end

    trait :evening_reflection do
      streak_type { :evening_reflection }
    end

    trait :weekly_review do
      streak_type { :weekly_review }
    end

    trait :with_streak do
      current_count { 5 }
      longest_count { 10 }
      last_activity_date { Time.zone.today }
    end

    trait :at_milestone do
      current_count { 7 }
      longest_count { 7 }
      last_activity_date { Time.zone.today }
    end

    trait :at_30_day_milestone do
      current_count { 30 }
      longest_count { 30 }
      last_activity_date { Time.zone.today }
    end

    trait :broken do
      current_count { 5 }
      longest_count { 10 }
      last_activity_date { 3.days.ago.to_date }
    end

    trait :yesterday do
      current_count { 5 }
      longest_count { 10 }
      last_activity_date { 1.day.ago.to_date }
    end
  end
end
