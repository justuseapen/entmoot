# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    email { Faker::Internet.unique.email }
    name { Faker::Name.name }
    password { "password123" }
    password_confirmation { "password123" }
    avatar_url { nil }

    trait :with_avatar do
      avatar_url { Faker::Avatar.image }
    end
  end
end
