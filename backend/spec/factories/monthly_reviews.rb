# frozen_string_literal: true

FactoryBot.define do
  factory :monthly_review do
    user
    family
    month { Time.zone.today.beginning_of_month }
    highlights { [] }
    challenges { [] }
    next_month_focus { [] }
    lessons_learned { nil }
    completed { false }

    trait :with_content do
      highlights { ["Completed Q1 goals", "Team collaboration improved"] }
      challenges { ["Resource constraints", "Time management"] }
      next_month_focus { ["Launch new feature", "Improve documentation", "Team building"] }
      lessons_learned { Faker::Lorem.paragraph }
    end

    trait :completed do
      highlights { ["Shipped major release", "All reviews completed on time"] }
      challenges { ["Unexpected bugs"] }
      next_month_focus { ["Performance optimization"] }
      lessons_learned { Faker::Lorem.paragraph }
      completed { true }
    end

    trait :last_month do
      month { 1.month.ago.to_date.beginning_of_month }
    end

    trait :two_months_ago do
      month { 2.months.ago.to_date.beginning_of_month }
    end
  end
end
