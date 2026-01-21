# frozen_string_literal: true

FactoryBot.define do
  factory :google_calendar_credential do
    user
    access_token { SecureRandom.urlsafe_base64(32) }
    refresh_token { SecureRandom.urlsafe_base64(32) }
    token_expires_at { 1.hour.from_now }
    calendar_id { "primary" }
    calendar_name { "My Calendar" }
    google_email { user&.email || Faker::Internet.email }
    sync_status { "active" }
    last_sync_at { nil }
    last_error { nil }

    trait :active do
      sync_status { "active" }
      last_error { nil }
    end

    trait :paused do
      sync_status { "paused" }
    end

    trait :error do
      sync_status { "error" }
      last_error { "Token refresh failed: invalid_grant" }
    end

    trait :expired_token do
      token_expires_at { 1.hour.ago }
    end

    trait :expiring_soon do
      token_expires_at { 3.minutes.from_now }
    end

    trait :recently_synced do
      last_sync_at { 5.minutes.ago }
    end

    trait :needs_refresh do
      token_expires_at { 2.minutes.from_now }
    end
  end
end
