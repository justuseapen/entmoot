# frozen_string_literal: true

FactoryBot.define do
  factory :reflection do
    daily_plan
    reflection_type { :evening }
    mood { nil }
    energy_level { nil }
    gratitude_items { [] }

    trait :evening do
      reflection_type { :evening }
    end

    trait :weekly do
      reflection_type { :weekly }
    end

    trait :monthly do
      reflection_type { :monthly }
    end

    trait :quarterly do
      reflection_type { :quarterly }
    end

    trait :annual do
      reflection_type { :annual }
    end

    trait :quick do
      daily_plan { nil }
      user
      family
      reflection_type { :quick }
    end

    trait :with_mood do
      mood { :good }
    end

    trait :with_energy do
      energy_level { 4 }
    end

    trait :with_gratitude do
      gratitude_items { ["Family", "Health", "Good weather"] }
    end

    trait :completed do
      after(:create) do |reflection|
        create(:reflection_response, :answered, reflection: reflection, prompt: "What went well today?")
      end
    end

    trait :with_responses do
      after(:create) do |reflection|
        create(:reflection_response, :answered, reflection: reflection, prompt: "What went well today?")
        create(:reflection_response, :answered, reflection: reflection, prompt: "What was challenging?")
      end
    end
  end
end
