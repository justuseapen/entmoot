# frozen_string_literal: true

FactoryBot.define do
  factory :feedback_report do
    user
    report_type { "bug" }
    title { "Test bug report" }
    description { "Something went wrong when clicking the button" }
    status { "new" }
    context_data do
      {
        "url" => "/dashboard",
        "browser" => "Chrome 120",
        "os" => "macOS 14",
        "screen_resolution" => "1920x1080",
        "app_version" => "1.0.0",
        "timestamp" => Time.current.iso8601
      }
    end

    trait :bug do
      report_type { "bug" }
      severity { "major" }
    end

    trait :feature_request do
      report_type { "feature_request" }
      title { "Feature request: Dark mode" }
      description { "It would be great to have a dark mode option" }
    end

    trait :feedback do
      report_type { "feedback" }
      title { "General feedback" }
      description { "Really enjoying the app so far!" }
    end

    trait :nps do
      report_type { "nps" }
      title { "NPS Survey Response" }
      description { nil }
      context_data do
        {
          "score" => 9,
          "follow_up" => "Great product!",
          "url" => "/dashboard"
        }
      end
    end

    trait :quick_feedback do
      report_type { "quick_feedback" }
      title { "Feature feedback" }
      description { nil }
      context_data do
        {
          "feature" => "weekly_review",
          "rating" => "positive",
          "url" => "/weekly-review"
        }
      end
    end

    trait :anonymous do
      user { nil }
    end

    trait :with_contact do
      allow_contact { true }
      contact_email { "user@example.com" }
    end

    trait :acknowledged do
      status { "acknowledged" }
    end

    trait :in_progress do
      status { "in_progress" }
    end

    trait :resolved do
      status { "resolved" }
      resolved_at { Time.current }
    end

    trait :closed do
      status { "closed" }
    end

    trait :blocker do
      severity { "blocker" }
    end

    trait :major do
      severity { "major" }
    end

    trait :minor do
      severity { "minor" }
    end

    trait :cosmetic do
      severity { "cosmetic" }
    end
  end
end
