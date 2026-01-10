# frozen_string_literal: true

FactoryBot.define do
  factory :goal_assignment do
    goal
    user { association :user }

    trait :with_family_member do
      after(:build) do |assignment|
        unless assignment.user.member_of?(assignment.goal.family)
          create(:family_membership, family: assignment.goal.family, user: assignment.user)
        end
      end
    end
  end
end
