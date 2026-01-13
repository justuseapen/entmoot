# frozen_string_literal: true

FactoryBot.define do
  factory :quarterly_review do
    user
    family
    quarter_start_date { QuarterlyReview.quarter_start_date_for(family) }
    achievements { [] }
    obstacles { [] }
    next_quarter_objectives { [] }
    insights { nil }
    completed { false }

    trait :with_content do
      achievements { ["Launched new product feature", "Increased user engagement by 25%"] }
      obstacles { ["Team capacity constraints", "Technical debt"] }
      next_quarter_objectives { ["Scale infrastructure", "Hire two engineers", "Improve test coverage"] }
      insights { Faker::Lorem.paragraph }
    end

    trait :completed do
      achievements { ["Met all quarterly goals", "Shipped major release on time"] }
      obstacles { ["Scope creep", "External dependencies"] }
      next_quarter_objectives { ["Focus on performance optimization"] }
      insights { Faker::Lorem.paragraph }
      completed { true }
    end

    trait :last_quarter do
      quarter_start_date do
        today = Time.zone.today
        current_quarter_month = [1, 4, 7, 10].reverse.find { |m| m <= today.month }
        prev_quarter_month = current_quarter_month == 1 ? 10 : current_quarter_month - 3
        year = current_quarter_month == 1 ? today.year - 1 : today.year
        Date.new(year, prev_quarter_month, 1)
      end
    end

    trait :two_quarters_ago do
      quarter_start_date do
        today = Time.zone.today
        current_quarter_month = [1, 4, 7, 10].reverse.find { |m| m <= today.month }
        # Go back 6 months (2 quarters)
        target = Date.new(today.year, current_quarter_month, 1) - 6.months
        [1, 4, 7, 10].reverse.find { |m| m <= target.month } || 10
        quarter_month = [1, 4, 7, 10].reverse.find { |m| m <= target.month }
        Date.new(target.year, quarter_month, 1)
      end
    end
  end
end
