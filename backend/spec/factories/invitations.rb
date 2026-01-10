# frozen_string_literal: true

FactoryBot.define do
  factory :invitation do
    family
    inviter factory: :user
    email { Faker::Internet.unique.email }
    role { :adult }
    token { SecureRandom.urlsafe_base64(32) }
    expires_at { 7.days.from_now }

    trait :admin do
      role { :admin }
    end

    trait :teen do
      role { :teen }
    end

    trait :expired do
      expires_at { 1.day.ago }
    end

    trait :accepted do
      accepted_at { 1.hour.ago }
      expires_at { 7.days.from_now }
    end
  end
end
