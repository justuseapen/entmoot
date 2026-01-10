# frozen_string_literal: true

FactoryBot.define do
  factory :family do
    name { Faker::Team.name }
    timezone { "America/New_York" }
    settings { {} }

    trait :with_members do
      after(:create) do |family|
        create(:family_membership, :admin, family: family)
        create(:family_membership, :adult, family: family)
        create(:family_membership, :teen, family: family)
      end
    end
  end
end
