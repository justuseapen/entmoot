# frozen_string_literal: true

FactoryBot.define do
  factory :notification_preference do
    user

    # Channel preferences (defaults)
    in_app { true }
    email { true }
    push { false }

    # Reminder preferences (defaults)
    morning_planning { true }
    evening_reflection { true }
    weekly_review { true }

    # Preferred times (defaults from PRD)
    morning_planning_time { "07:00" }
    evening_reflection_time { "20:00" }
    weekly_review_time { "18:00" }
    weekly_review_day { 0 } # Sunday

    # Quiet hours (defaults)
    quiet_hours_start { "22:00" }
    quiet_hours_end { "07:00" }

    trait :all_channels_disabled do
      in_app { false }
      email { false }
      push { false }
    end

    trait :all_reminders_disabled do
      morning_planning { false }
      evening_reflection { false }
      weekly_review { false }
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
  end
end
