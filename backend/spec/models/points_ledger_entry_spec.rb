# frozen_string_literal: true

require "rails_helper"

RSpec.describe PointsLedgerEntry do
  describe "validations" do
    it { is_expected.to validate_presence_of(:points) }
    it { is_expected.to validate_numericality_of(:points).only_integer.is_greater_than(0) }
    it { is_expected.to validate_presence_of(:activity_type) }
    it { is_expected.to validate_inclusion_of(:activity_type).in_array(described_class::ACTIVITY_TYPES) }
  end

  describe "associations" do
    it { is_expected.to belong_to(:user) }
  end

  describe "ACTIVITY_POINTS" do
    it "defines correct point values for each activity" do
      expect(described_class::ACTIVITY_POINTS).to eq({
                                                       "complete_task" => 5,
                                                       "complete_daily_plan" => 10,
                                                       "complete_reflection" => 20,
                                                       "complete_weekly_review" => 50,
                                                       "create_goal" => 15,
                                                       "complete_goal" => 30,
                                                       "earn_badge" => 25,
                                                       "streak_milestone" => 50
                                                     })
    end
  end

  describe ".points_for" do
    it "returns correct points for complete_task" do
      expect(described_class.points_for("complete_task")).to eq(5)
    end

    it "returns correct points for complete_weekly_review" do
      expect(described_class.points_for("complete_weekly_review")).to eq(50)
    end

    it "returns 0 for unknown activity type" do
      expect(described_class.points_for("unknown")).to eq(0)
    end
  end

  describe "scopes" do
    let(:user) { create(:user) }

    describe ".recent" do
      it "orders entries by created_at descending" do
        old_entry = create(:points_ledger_entry, user: user, created_at: 2.days.ago)
        new_entry = create(:points_ledger_entry, user: user, created_at: 1.hour.ago)

        expect(described_class.recent).to eq([new_entry, old_entry])
      end
    end

    describe ".by_activity" do
      it "filters by activity type" do
        task_entry = create(:points_ledger_entry, :complete_task, user: user)
        create(:points_ledger_entry, :complete_reflection, user: user)

        expect(described_class.by_activity("complete_task")).to eq([task_entry])
      end
    end

    describe ".today" do
      it "returns entries from today" do
        today_entry = create(:points_ledger_entry, user: user, created_at: Time.zone.now)
        create(:points_ledger_entry, user: user, created_at: 1.day.ago)

        expect(described_class.today).to eq([today_entry])
      end
    end

    describe ".this_week" do
      it "returns entries from this week" do
        this_week_entry = create(:points_ledger_entry, :this_week, user: user)
        create(:points_ledger_entry, :last_week, user: user)

        expect(described_class.this_week).to include(this_week_entry)
      end
    end
  end

  describe ".total_for_user" do
    let(:user) { create(:user) }
    let(:other_user) { create(:user) }

    it "sums points for the specified user" do
      create(:points_ledger_entry, user: user, points: 5)
      create(:points_ledger_entry, user: user, points: 20)
      create(:points_ledger_entry, user: other_user, points: 50)

      expect(described_class.total_for_user(user)).to eq(25)
    end

    it "returns 0 when user has no entries" do
      expect(described_class.total_for_user(user)).to eq(0)
    end
  end

  describe ".total_this_week_for_user" do
    let(:user) { create(:user) }

    it "sums only this week's points for the user" do
      create(:points_ledger_entry, :this_week, user: user, points: 10)
      create(:points_ledger_entry, :this_week, user: user, points: 15)
      create(:points_ledger_entry, :last_week, user: user, points: 50)

      expect(described_class.total_this_week_for_user(user)).to eq(25)
    end
  end
end
