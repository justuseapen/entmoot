# frozen_string_literal: true

FactoryBot.define do
  factory :outreach_history do
    user
    outreach_type { "missed_checkin" }
    channel { "push" }
    sent_at { Time.current }

    trait :missed_checkin do
      outreach_type { "missed_checkin" }
    end

    trait :missed_reflection do
      outreach_type { "missed_reflection" }
    end

    trait :inactive_3_days do
      outreach_type { "inactive_3_days" }
    end

    trait :inactive_7_days do
      outreach_type { "inactive_7_days" }
    end

    trait :inactive_14_days do
      outreach_type { "inactive_14_days" }
    end

    trait :inactive_30_days do
      outreach_type { "inactive_30_days" }
    end

    trait :via_push do
      channel { "push" }
    end

    trait :via_email do
      channel { "email" }
    end

    trait :via_sms do
      channel { "sms" }
    end
  end
end
