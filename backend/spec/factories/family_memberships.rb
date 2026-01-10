# frozen_string_literal: true

FactoryBot.define do
  factory :family_membership do
    family
    user
    role { :observer }

    trait :admin do
      role { :admin }
    end

    trait :adult do
      role { :adult }
    end

    trait :teen do
      role { :teen }
    end

    trait :child do
      role { :child }
    end

    trait :observer do
      role { :observer }
    end
  end
end
