# frozen_string_literal: true

FactoryBot.define do
  factory :notification_preference do
    user

    # Channel preferences (defaults)
    in_app { true }
    email { true }
    push { false }
    sms { false }

    # Reminder preferences (defaults)
    morning_planning { true }
    evening_reflection { true }
    weekly_review { true }
    monthly_review { true }
    monthly_review_day { 1 }
    quarterly_review { true }
    annual_review { true }

    # Preferred times (defaults from PRD)
    morning_planning_time { "07:00" }
    evening_reflection_time { "20:00" }
    weekly_review_time { "18:00" }
    weekly_review_day { 0 } # Sunday

    # Quiet hours (defaults)
    quiet_hours_start { "22:00" }
    quiet_hours_end { "07:00" }

    # Re-engagement settings (default to enabled)
    reengagement_enabled { true }
    missed_checkin_reminder { true }
    inactivity_reminder { true }
    inactivity_threshold_days { 7 }

    # Check-in frequency (default to daily)
    check_in_frequency { "daily" }

    trait :all_channels_disabled do
      in_app { false }
      email { false }
      push { false }
      sms { false }
    end

    trait :sms_enabled do
      sms { true }
    end

    trait :all_reminders_disabled do
      morning_planning { false }
      evening_reflection { false }
      weekly_review { false }
      monthly_review { false }
      quarterly_review { false }
      annual_review { false }
    end

    trait :push_enabled do
      push { true }
    end

    trait :custom_times do
      morning_planning_time { "06:30" }
      evening_reflection_time { "21:30" }
      weekly_review_time { "17:00" }
      weekly_review_day { 1 } # Monday
    end

    # Check-in frequency traits
    trait :weekly_frequency do
      check_in_frequency { "weekly" }
    end

    trait :monthly_frequency do
      check_in_frequency { "monthly" }
    end

    trait :quarterly_frequency do
      check_in_frequency { "quarterly" }
    end

    trait :annual_frequency do
      check_in_frequency { "annual" }
    end

    trait :as_needed_frequency do
      check_in_frequency { "as_needed" }
    end
  end
end
