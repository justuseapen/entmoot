# frozen_string_literal: true

FactoryBot.define do
  factory :points_ledger_entry do
    user
    points { 5 }
    activity_type { "complete_task" }
    metadata { {} }

    trait :complete_task do
      activity_type { "complete_task" }
      points { 5 }
      metadata { { task_id: 1, task_title: "Sample task" } }
    end

    trait :complete_daily_plan do
      activity_type { "complete_daily_plan" }
      points { 10 }
      metadata { { daily_plan_id: 1, date: Time.zone.today.to_s } }
    end

    trait :complete_reflection do
      activity_type { "complete_reflection" }
      points { 20 }
      metadata { { reflection_id: 1, reflection_type: "evening" } }
    end

    trait :complete_weekly_review do
      activity_type { "complete_weekly_review" }
      points { 50 }
      metadata { { weekly_review_id: 1, week_start_date: Time.zone.today.to_s } }
    end

    trait :create_goal do
      activity_type { "create_goal" }
      points { 15 }
      metadata { { goal_id: 1, goal_title: "Sample goal", time_scale: "weekly" } }
    end

    trait :complete_goal do
      activity_type { "complete_goal" }
      points { 30 }
      metadata { { goal_id: 1, goal_title: "Sample goal", time_scale: "weekly" } }
    end

    trait :earn_badge do
      activity_type { "earn_badge" }
      points { 25 }
      metadata { { badge_id: 1, badge_name: "first_goal" } }
    end

    trait :streak_milestone do
      activity_type { "streak_milestone" }
      points { 50 }
      metadata { { streak_id: 1, streak_type: "daily_planning", milestone: 7 } }
    end

    trait :this_week do
      created_at { Time.zone.now.beginning_of_week + 1.day }
    end

    trait :last_week do
      created_at { 1.week.ago }
    end
  end
end
