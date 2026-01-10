# frozen_string_literal: true

FactoryBot.define do
  factory :pet do
    family
    name { Faker::Creature::Dog.name }
    pet_type { %w[dog cat bird fish hamster rabbit].sample }
    avatar_url { nil }
    birthday { Faker::Date.birthday(min_age: 1, max_age: 15) }
    notes { Faker::Lorem.sentence }

    trait :dog do
      pet_type { "dog" }
      name { Faker::Creature::Dog.name }
    end

    trait :cat do
      pet_type { "cat" }
      name { Faker::Creature::Cat.name }
    end

    trait :with_avatar do
      avatar_url { "https://example.com/pets/#{SecureRandom.hex(8)}.jpg" }
    end
  end
end
