# frozen_string_literal: true

require "rails_helper"

RSpec.describe PointsService do
  let(:user) { create(:user) }
  let(:family) { create(:family) }

  before do
    create(:family_membership, user: user, family: family, role: :admin)
  end

  describe ".award_task_completion" do
    it "creates a points ledger entry for task completion" do
      expect { described_class.award_task_completion(user: user) }
        .to change(PointsLedgerEntry, :count).by(1)
    end

    it "awards 5 points" do
      entry = described_class.award_task_completion(user: user)
      expect(entry.points).to eq(5)
    end

    it "sets correct activity_type" do
      entry = described_class.award_task_completion(user: user)
      expect(entry.activity_type).to eq("complete_task")
    end

    it "stores task metadata when task is provided" do
      daily_plan = create(:daily_plan, user: user, family: family)
      task = create(:daily_task, daily_plan: daily_plan, title: "My Task")

      entry = described_class.award_task_completion(user: user, task: task)
      expect(entry.metadata).to include("task_id" => task.id, "task_title" => "My Task")
    end
  end

  describe ".award_daily_plan_completion" do
    it "creates a points ledger entry" do
      expect { described_class.award_daily_plan_completion(user: user) }
        .to change(PointsLedgerEntry, :count).by(1)
    end

    it "awards 10 points" do
      entry = described_class.award_daily_plan_completion(user: user)
      expect(entry.points).to eq(10)
    end
  end

  describe ".award_reflection_completion" do
    it "creates a points ledger entry" do
      expect { described_class.award_reflection_completion(user: user) }
        .to change(PointsLedgerEntry, :count).by(1)
    end

    it "awards 20 points" do
      entry = described_class.award_reflection_completion(user: user)
      expect(entry.points).to eq(20)
    end

    it "stores reflection metadata when reflection is provided" do
      daily_plan = create(:daily_plan, user: user, family: family)
      reflection = create(:reflection, :evening, daily_plan: daily_plan)

      entry = described_class.award_reflection_completion(user: user, reflection: reflection)
      expect(entry.metadata).to include("reflection_id" => reflection.id, "reflection_type" => "evening")
    end
  end

  describe ".award_weekly_review_completion" do
    it "creates a points ledger entry" do
      expect { described_class.award_weekly_review_completion(user: user) }
        .to change(PointsLedgerEntry, :count).by(1)
    end

    it "awards 50 points" do
      entry = described_class.award_weekly_review_completion(user: user)
      expect(entry.points).to eq(50)
    end
  end

  describe ".award_goal_creation" do
    it "creates a points ledger entry" do
      expect { described_class.award_goal_creation(user: user) }
        .to change(PointsLedgerEntry, :count).by(1)
    end

    it "awards 15 points" do
      entry = described_class.award_goal_creation(user: user)
      expect(entry.points).to eq(15)
    end

    it "stores goal metadata when goal is provided" do
      goal = create(:goal, family: family, creator: user, title: "My Goal", time_scale: :weekly)

      entry = described_class.award_goal_creation(user: user, goal: goal)
      expect(entry.metadata).to include("goal_id" => goal.id, "goal_title" => "My Goal", "time_scale" => "weekly")
    end
  end

  describe ".award_goal_completion" do
    it "creates a points ledger entry" do
      expect { described_class.award_goal_completion(user: user) }
        .to change(PointsLedgerEntry, :count).by(1)
    end

    it "awards 30 points" do
      entry = described_class.award_goal_completion(user: user)
      expect(entry.points).to eq(30)
    end
  end

  describe ".award_badge_earned" do
    let!(:badge) { create(:badge, name: "first_goal") }

    it "creates a points ledger entry" do
      expect { described_class.award_badge_earned(user: user, badge: badge) }
        .to change(PointsLedgerEntry, :count).by(1)
    end

    it "awards 25 points" do
      entry = described_class.award_badge_earned(user: user, badge: badge)
      expect(entry.points).to eq(25)
    end

    it "stores badge metadata" do
      entry = described_class.award_badge_earned(user: user, badge: badge)
      expect(entry.metadata).to include("badge_id" => badge.id, "badge_name" => "first_goal")
    end
  end

  describe ".award_streak_milestone" do
    let!(:streak) { create(:streak, :daily_planning, user: user, current_count: 7) }

    it "creates a points ledger entry" do
      expect { described_class.award_streak_milestone(user: user, streak: streak, milestone: 7) }
        .to change(PointsLedgerEntry, :count).by(1)
    end

    it "awards 50 points" do
      entry = described_class.award_streak_milestone(user: user, streak: streak, milestone: 7)
      expect(entry.points).to eq(50)
    end

    it "stores streak milestone metadata" do
      entry = described_class.award_streak_milestone(user: user, streak: streak, milestone: 7)
      expect(entry.metadata).to include(
        "streak_id" => streak.id,
        "streak_type" => "daily_planning",
        "milestone" => 7
      )
    end
  end

  describe ".total_points" do
    it "returns total points for user" do
      create(:points_ledger_entry, user: user, points: 10)
      create(:points_ledger_entry, user: user, points: 20)

      expect(described_class.total_points(user)).to eq(30)
    end

    it "returns 0 when user has no points" do
      expect(described_class.total_points(user)).to eq(0)
    end
  end

  describe ".weekly_points" do
    it "returns this week's points for user" do
      create(:points_ledger_entry, :this_week, user: user, points: 10)
      create(:points_ledger_entry, :last_week, user: user, points: 50)

      expect(described_class.weekly_points(user)).to eq(10)
    end
  end

  describe ".recent_activity" do
    it "returns recent entries for user" do
      create_list(:points_ledger_entry, 5, user: user)

      result = described_class.recent_activity(user, limit: 3)

      expect(result.count).to eq(3)
    end

    it "orders by created_at descending" do
      old_entry = create(:points_ledger_entry, user: user, created_at: 2.days.ago)
      new_entry = create(:points_ledger_entry, user: user, created_at: 1.hour.ago)

      result = described_class.recent_activity(user)

      expect(result.first).to eq(new_entry)
      expect(result.last).to eq(old_entry)
    end

    it "defaults to 20 entries" do
      create_list(:points_ledger_entry, 25, user: user)

      result = described_class.recent_activity(user)

      expect(result.count).to eq(20)
    end
  end

  describe ".points_breakdown" do
    it "returns points grouped by activity type" do
      create(:points_ledger_entry, :complete_task, user: user, points: 5)
      create(:points_ledger_entry, :complete_task, user: user, points: 5)
      create(:points_ledger_entry, :complete_reflection, user: user, points: 20)

      result = described_class.points_breakdown(user)

      expect(result).to eq({
                             "complete_task" => 10,
                             "complete_reflection" => 20
                           })
    end
  end
end
