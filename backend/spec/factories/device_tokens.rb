# frozen_string_literal: true

FactoryBot.define do
  factory :device_token do
    user
    token { SecureRandom.hex(32) }
    platform { "android" }
    device_name { "#{Faker::Device.manufacturer} #{Faker::Device.model_name}" }
    last_used_at { nil }

    trait :ios do
      platform { "ios" }
    end

    trait :android do
      platform { "android" }
    end

    trait :web do
      platform { "web" }
    end

    trait :recently_used do
      last_used_at { 1.day.ago }
    end

    trait :stale do
      last_used_at { 45.days.ago }
    end
  end
end
