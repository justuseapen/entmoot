# frozen_string_literal: true

FactoryBot.define do
  factory :reflection_response do
    reflection
    prompt { "What went well today?" }
    response { nil }

    trait :answered do
      response { Faker::Lorem.paragraph }
    end

    trait :unanswered do
      response { nil }
    end

    trait :went_well do
      prompt { "What went well today?" }
    end

    trait :challenging do
      prompt { "What was challenging?" }
    end

    trait :learned do
      prompt { "What did you learn today?" }
    end

    trait :tomorrow do
      prompt { "What will you do differently tomorrow?" }
    end
  end
end
