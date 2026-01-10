# frozen_string_literal: true

FactoryBot.define do
  factory :goal do
    family
    creator { association :user }
    title { Faker::Lorem.sentence(word_count: 4) }
    description { Faker::Lorem.paragraph }
    time_scale { :weekly }
    status { :not_started }
    visibility { :family }
    progress { 0 }

    trait :daily do
      time_scale { :daily }
    end

    trait :weekly do
      time_scale { :weekly }
    end

    trait :monthly do
      time_scale { :monthly }
    end

    trait :quarterly do
      time_scale { :quarterly }
    end

    trait :annual do
      time_scale { :annual }
    end

    trait :not_started do
      status { :not_started }
      progress { 0 }
    end

    trait :in_progress do
      status { :in_progress }
      progress { 50 }
    end

    trait :at_risk do
      status { :at_risk }
      progress { 25 }
    end

    trait :completed do
      status { :completed }
      progress { 100 }
    end

    trait :abandoned do
      status { :abandoned }
    end

    trait :personal do
      visibility { :personal }
    end

    trait :shared do
      visibility { :shared }
    end

    trait :family_visible do
      visibility { :family }
    end

    trait :with_smart do
      specific { "Complete the quarterly sales report by analyzing Q4 data" }
      measurable { "Track number of sections completed out of 8 total sections" }
      achievable { "Based on past experience, 2-3 days of focused work is sufficient" }
      relevant { "Required for annual review and strategic planning session" }
      time_bound { "Due by end of month for board meeting preparation" }
    end

    trait :with_due_date do
      due_date { 2.weeks.from_now.to_date }
    end

    trait :with_parent do
      parent { association :goal, :annual, family: family }
    end
  end
end
