# frozen_string_literal: true

FactoryBot.define do
  factory :calendar_sync_mapping do
    user
    google_event_id { "event_#{SecureRandom.hex(12)}" }
    google_calendar_id { "primary" }
    last_synced_at { Time.current }
    etag { "\"#{SecureRandom.hex(16)}\"" }

    trait :for_goal do
      association :syncable, factory: :goal
    end

    trait :for_weekly_review do
      association :syncable, factory: :weekly_review
    end

    trait :for_monthly_review do
      association :syncable, factory: :monthly_review
    end

    trait :for_quarterly_review do
      association :syncable, factory: :quarterly_review
    end

    trait :for_annual_review do
      association :syncable, factory: :annual_review
    end

    trait :stale do
      last_synced_at { 25.hours.ago }
    end
  end
end
