# frozen_string_literal: true

FactoryBot.define do
  factory :badge do
    sequence(:name) { |n| "badge_#{n}" }
    description { "A badge for testing" }
    icon { "🏆" }
    category { "general" }
    criteria { { type: "goal_count", count: 1 } }

    trait :goals do
      category { "goals" }
    end

    trait :planning do
      category { "planning" }
    end

    trait :reflection do
      category { "reflection" }
    end

    trait :streaks do
      category { "streaks" }
    end

    trait :first_goal do
      name { "first_goal" }
      description { "Created your first goal. Every journey begins with a single step!" }
      icon { "🎯" }
      category { "goals" }
      criteria { { type: "goal_count", count: 1 } }
    end

    trait :goal_setter do
      name { "goal_setter" }
      description { "Created 5 goals. You're building a roadmap for success!" }
      icon { "📋" }
      category { "goals" }
      criteria { { type: "goal_count", count: 5 } }
    end

    trait :week_warrior do
      name { "week_warrior" }
      description { "Maintained a 7-day streak. A week of consistency is a powerful start!" }
      icon { "🔥" }
      category { "streaks" }
      criteria { { type: "streak_days", days: 7 } }
    end

    trait :first_reflection do
      name { "first_reflection" }
      description { "Completed your first evening reflection. Self-awareness is the foundation of growth!" }
      icon { "🌙" }
      category { "reflection" }
      criteria { { type: "reflection_count", count: 1 } }
    end

    trait :first_plan do
      name { "first_plan" }
      description { "Created your first daily plan. Planning is bringing the future into the present!" }
      icon { "📝" }
      category { "planning" }
      criteria { { type: "daily_plan_count", count: 1 } }
    end
  end
end
