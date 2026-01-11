# frozen_string_literal: true

FactoryBot.define do
  factory :daily_plan do
    user
    family
    date { Time.zone.today }
    intention { nil }

    trait :with_intention do
      intention { Faker::Lorem.sentence }
    end

    trait :yesterday do
      date { Time.zone.yesterday }
    end

    trait :tomorrow do
      date { Time.zone.tomorrow }
    end

    trait :with_tasks do
      after(:create) do |plan|
        create_list(:daily_task, 3, daily_plan: plan)
      end
    end

    trait :with_completed_tasks do
      after(:create) do |plan|
        create_list(:daily_task, 2, :completed, daily_plan: plan)
        create_list(:daily_task, 1, :incomplete, daily_plan: plan)
      end
    end

    trait :with_priorities do
      after(:create) do |plan|
        create(:top_priority, daily_plan: plan, priority_order: 1)
        create(:top_priority, daily_plan: plan, priority_order: 2)
      end
    end
  end
end
