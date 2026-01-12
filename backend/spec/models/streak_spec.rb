# frozen_string_literal: true

require "rails_helper"

RSpec.describe Streak do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:streak_type) }

    it do
      expect(described_class.new).to define_enum_for(:streak_type)
        .with_values(daily_planning: 0, evening_reflection: 1, weekly_review: 2)
        .with_prefix(false)
    end

    describe "uniqueness of streak_type per user" do
      subject(:streak) { create(:streak) }

      it "validates uniqueness scoped to user" do
        expect(streak).to validate_uniqueness_of(:streak_type)
          .scoped_to(:user_id)
          .with_message(:already_exists)
      end
    end

    it { is_expected.to validate_numericality_of(:current_count).is_greater_than_or_equal_to(0) }
    it { is_expected.to validate_numericality_of(:longest_count).is_greater_than_or_equal_to(0) }
  end

  describe "scopes" do
    describe ".for_user" do
      let(:target_user) { create(:user) }
      let(:other_user) { create(:user) }
      let!(:target_streak) { create(:streak, user: target_user) }

      before { create(:streak, user: other_user) }

      it "returns streaks for the specified user" do
        expect(described_class.for_user(target_user)).to contain_exactly(target_streak)
      end
    end
  end

  describe ".find_or_create_for" do
    let(:user) { create(:user) }

    context "when no streak exists" do
      it "creates a new streak" do
        expect do
          described_class.find_or_create_for(user: user, streak_type: :daily_planning)
        end.to change(described_class, :count).by(1)
      end

      it "returns the created streak with correct attributes" do
        streak = described_class.find_or_create_for(user: user, streak_type: :evening_reflection)
        expect(streak.streak_type).to eq("evening_reflection")
        expect(streak.user).to eq(user)
        expect(streak.current_count).to eq(0)
      end
    end

    context "when streak already exists" do
      let!(:existing_streak) { create(:streak, user: user, streak_type: :daily_planning, current_count: 5) }

      it "does not create a new streak" do
        expect do
          described_class.find_or_create_for(user: user, streak_type: :daily_planning)
        end.not_to change(described_class, :count)
      end

      it "returns the existing streak" do
        streak = described_class.find_or_create_for(user: user, streak_type: :daily_planning)
        expect(streak.id).to eq(existing_streak.id)
        expect(streak.current_count).to eq(5)
      end
    end
  end

  describe "#milestone_reached?" do
    let(:streak) { build(:streak) }

    context "when current_count matches a milestone" do
      it "returns true for 7-day milestone" do
        streak.current_count = 7
        expect(streak.milestone_reached?).to be true
      end

      it "returns true for 30-day milestone" do
        streak.current_count = 30
        expect(streak.milestone_reached?).to be true
      end

      it "returns true for 365-day milestone" do
        streak.current_count = 365
        expect(streak.milestone_reached?).to be true
      end
    end

    context "when current_count does not match a milestone" do
      it "returns false for 5 days" do
        streak.current_count = 5
        expect(streak.milestone_reached?).to be false
      end

      it "returns false for 8 days" do
        streak.current_count = 8
        expect(streak.milestone_reached?).to be false
      end
    end
  end

  describe "#broken?" do
    let(:user) { create(:user) }
    let(:today) { Time.zone.today }

    context "with daily streak (daily_planning)" do
      let(:streak) { build(:streak, :daily_planning, user: user) }

      it "returns false when last_activity_date is nil" do
        streak.last_activity_date = nil
        expect(streak.broken?(today)).to be false
      end

      it "returns false when activity was today" do
        streak.last_activity_date = today
        expect(streak.broken?(today)).to be false
      end

      it "returns false when activity was yesterday" do
        streak.last_activity_date = today - 1.day
        expect(streak.broken?(today)).to be false
      end

      it "returns true when activity was 2 days ago" do
        streak.last_activity_date = today - 2.days
        expect(streak.broken?(today)).to be true
      end
    end

    context "with weekly streak (weekly_review)" do
      let(:streak) { build(:streak, :weekly_review, user: user) }

      it "returns false when activity was 6 days ago" do
        streak.last_activity_date = today - 6.days
        expect(streak.broken?(today)).to be false
      end

      it "returns false when activity was 7 days ago" do
        streak.last_activity_date = today - 7.days
        expect(streak.broken?(today)).to be false
      end

      it "returns true when activity was 8 days ago" do
        streak.last_activity_date = today - 8.days
        expect(streak.broken?(today)).to be true
      end
    end

    context "with grace period" do
      let(:streak) { build(:streak, :daily_planning, user: user) }

      it "returns false when within grace period" do
        streak.last_activity_date = today - 2.days
        expect(streak.broken?(today, grace_period_days: 1)).to be false
      end

      it "returns true when beyond grace period" do
        streak.last_activity_date = today - 3.days
        expect(streak.broken?(today, grace_period_days: 1)).to be true
      end
    end
  end

  describe "#record_activity!" do
    let(:user) { create(:user) }
    let(:today) { Time.zone.today }

    context "when starting a new streak" do
      let(:streak) { create(:streak, user: user, current_count: 0, longest_count: 0, last_activity_date: nil) }

      it "sets current_count to 1" do
        streak.record_activity!(today)
        expect(streak.current_count).to eq(1)
      end

      it "sets longest_count to 1" do
        streak.record_activity!(today)
        expect(streak.longest_count).to eq(1)
      end

      it "sets last_activity_date" do
        streak.record_activity!(today)
        expect(streak.last_activity_date).to eq(today)
      end

      it "returns true" do
        expect(streak.record_activity!(today)).to be true
      end
    end

    context "when continuing a streak (next day)" do
      let(:streak) do
        create(:streak, user: user, current_count: 5, longest_count: 10, last_activity_date: today - 1.day)
      end

      it "increments current_count" do
        streak.record_activity!(today)
        expect(streak.current_count).to eq(6)
      end

      it "does not change longest_count when below longest" do
        streak.record_activity!(today)
        expect(streak.longest_count).to eq(10)
      end

      it "updates longest_count when exceeding previous longest" do
        streak.update!(current_count: 10, longest_count: 10)
        streak.record_activity!(today)
        expect(streak.longest_count).to eq(11)
      end

      it "returns true" do
        expect(streak.record_activity!(today)).to be true
      end
    end

    context "when activity already recorded for today" do
      let(:streak) { create(:streak, user: user, current_count: 5, longest_count: 10, last_activity_date: today) }

      it "does not change current_count" do
        expect { streak.record_activity!(today) }.not_to(change { streak.reload.current_count })
      end

      it "returns false" do
        expect(streak.record_activity!(today)).to be false
      end
    end

    context "when streak is broken" do
      let(:streak) do
        create(:streak, user: user, current_count: 5, longest_count: 10, last_activity_date: today - 3.days)
      end

      it "resets current_count to 1" do
        streak.record_activity!(today)
        expect(streak.current_count).to eq(1)
      end

      it "does not change longest_count" do
        streak.record_activity!(today)
        expect(streak.longest_count).to eq(10)
      end

      it "returns true" do
        expect(streak.record_activity!(today)).to be true
      end
    end

    context "with weekly review streak" do
      let(:streak) do
        create(:streak, :weekly_review, user: user, current_count: 3, longest_count: 5,
                                        last_activity_date: today - 7.days)
      end

      it "increments when activity is exactly 7 days later" do
        streak.record_activity!(today)
        expect(streak.current_count).to eq(4)
      end

      it "does not increment when activity is within same week period" do
        streak.update!(last_activity_date: today - 3.days)
        streak.record_activity!(today)
        expect(streak.current_count).to eq(3)
      end
    end
  end
end
