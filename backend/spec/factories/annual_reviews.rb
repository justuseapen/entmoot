# frozen_string_literal: true

FactoryBot.define do
  factory :annual_review do
    user
    family
    year { AnnualReview.year_for(family) }
    year_highlights { [] }
    year_challenges { [] }
    lessons_learned { nil }
    gratitude { [] }
    next_year_theme { nil }
    next_year_goals { [] }
    completed { false }

    trait :with_content do
      year_highlights do
        [
          "Achieved 90% of family goals",
          "Improved morning routine consistency",
          "Kids started helping with chores"
        ]
      end
      year_challenges do
        [
          "Balancing work and family time",
          "Maintaining consistency during holidays"
        ]
      end
      lessons_learned { Faker::Lorem.paragraph }
      gratitude do
        [
          "Health and wellbeing of family",
          "Supportive community",
          "Quality time together"
        ]
      end
      next_year_theme { "Growth & Connection" }
      next_year_goals do
        [
          "Travel as a family twice",
          "Start weekly game nights",
          "Each person learns a new skill"
        ]
      end
    end

    trait :completed do
      year_highlights { ["Completed major family project", "Everyone met their personal goals"] }
      year_challenges { ["Pandemic challenges", "Remote learning"] }
      lessons_learned { Faker::Lorem.paragraph }
      gratitude { ["Family health", "Job stability", "Community support"] }
      next_year_theme { "Adventure Awaits" }
      next_year_goals { ["More outdoor activities", "Start a family hobby"] }
      completed { true }
    end

    trait :last_year do
      year { Time.zone.today.year - 1 }
    end

    trait :two_years_ago do
      year { Time.zone.today.year - 2 }
    end
  end
end
