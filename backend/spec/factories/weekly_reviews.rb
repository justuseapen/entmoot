# frozen_string_literal: true

FactoryBot.define do
  factory :weekly_review do
    user
    family
    week_start_date { Time.zone.today.beginning_of_week(:monday) }
    wins { [] }
    challenges { [] }
    next_week_priorities { [] }
    lessons_learned { nil }
    completed { false }

    trait :with_content do
      wins { ["Completed project milestone", "Great team collaboration"] }
      challenges { ["Tight deadlines", "Technical issues"] }
      next_week_priorities { ["Finish code review", "Plan sprint", "Update documentation"] }
      lessons_learned { Faker::Lorem.paragraph }
    end

    trait :completed do
      wins { ["Shipped new feature", "Resolved critical bug"] }
      challenges { ["Resource constraints"] }
      next_week_priorities { ["Performance optimization"] }
      lessons_learned { Faker::Lorem.paragraph }
      completed { true }
    end

    trait :last_week do
      week_start_date { 1.week.ago.to_date.beginning_of_week(:monday) }
    end

    trait :two_weeks_ago do
      week_start_date { 2.weeks.ago.to_date.beginning_of_week(:monday) }
    end
  end
end
