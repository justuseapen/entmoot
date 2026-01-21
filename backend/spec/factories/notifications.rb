# frozen_string_literal: true

FactoryBot.define do
  factory :notification do
    user
    title { "Test Notification" }
    body { "This is a test notification body" }
    read { false }
    link { nil }
    notification_type { :general }

    trait :read do
      read { true }
    end

    trait :unread do
      read { false }
    end

    trait :with_link do
      link { "/dashboard" }
    end

    trait :reminder do
      notification_type { :reminder }
      title { "Time for Morning Planning" }
      body { "Start your day with intention" }
      link { "/planner" }
    end

    trait :goal_update do
      notification_type { :goal_update }
      title { "Goal Update" }
      body { "Your goal has been updated" }
    end

    trait :family_invite do
      notification_type { :family_invite }
      title { "Family Invitation" }
      body { "You have been invited to join a family" }
    end

    trait :badge_earned do
      notification_type { :badge_earned }
      title { "Badge Earned!" }
      body { "You've earned the First Goal badge. Congratulations!" }
    end

    trait :streak_milestone do
      notification_type { :streak_milestone }
      title { "Streak Milestone!" }
      body { "Amazing! You've maintained a 7-day daily planning streak!" }
    end

    trait :mention do
      notification_type { :mention }
      title { "Someone mentioned you" }
      body { "Someone mentioned you in their post" }
    end
  end
end
