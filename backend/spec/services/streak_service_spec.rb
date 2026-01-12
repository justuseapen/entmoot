# frozen_string_literal: true

require "rails_helper"

RSpec.describe StreakService do
  let(:user) { create(:user) }
  let(:family) { create(:family, timezone: "America/New_York") }
  let(:today) { Time.zone.today }

  before do
    create(:family_membership, user: user, family: family, role: :admin)
  end

  describe ".record_daily_planning" do
    it "creates a streak if none exists" do
      expect do
        described_class.record_daily_planning(user: user)
      end.to change(Streak, :count).by(1)
    end

    it "returns the streak" do
      streak = described_class.record_daily_planning(user: user)
      expect(streak).to be_a(Streak)
      expect(streak.streak_type).to eq("daily_planning")
    end

    it "increments the streak count" do
      streak = described_class.record_daily_planning(user: user)
      expect(streak.current_count).to eq(1)
    end

    it "uses the provided date" do
      streak = described_class.record_daily_planning(user: user, date: today - 1.day)
      expect(streak.last_activity_date).to eq(today - 1.day)
    end

    it "triggers milestone notification for 7-day streak" do
      # Set up streak at 6 days
      create(:streak, :daily_planning, user: user, current_count: 6, longest_count: 6,
                                       last_activity_date: today - 1.day)

      allow(NotificationService).to receive(:notify_streak_milestone)

      described_class.record_daily_planning(user: user, date: today)

      expect(NotificationService).to have_received(:notify_streak_milestone)
        .with(user: user, streak_type: "daily_planning", count: 7)
    end

    it "does not trigger notification for non-milestone counts" do
      create(:streak, :daily_planning, user: user, current_count: 5, longest_count: 5,
                                       last_activity_date: today - 1.day)

      allow(NotificationService).to receive(:notify_streak_milestone)

      described_class.record_daily_planning(user: user, date: today)

      expect(NotificationService).not_to have_received(:notify_streak_milestone)
    end
  end

  describe ".record_evening_reflection" do
    it "creates an evening_reflection streak" do
      streak = described_class.record_evening_reflection(user: user)
      expect(streak.streak_type).to eq("evening_reflection")
      expect(streak.current_count).to eq(1)
    end

    it "increments an existing streak" do
      create(:streak, :evening_reflection, user: user, current_count: 3, longest_count: 3,
                                           last_activity_date: today - 1.day)

      streak = described_class.record_evening_reflection(user: user, date: today)
      expect(streak.current_count).to eq(4)
    end
  end

  describe ".record_weekly_review" do
    it "creates a weekly_review streak" do
      streak = described_class.record_weekly_review(user: user)
      expect(streak.streak_type).to eq("weekly_review")
      expect(streak.current_count).to eq(1)
    end

    it "increments after exactly 7 days" do
      last_week = today - 7.days
      create(:streak, :weekly_review, user: user, current_count: 2, longest_count: 2,
                                      last_activity_date: last_week)

      streak = described_class.record_weekly_review(user: user, date: today)
      expect(streak.current_count).to eq(3)
    end

    it "does not increment if within the same week period" do
      last_week = today - 3.days
      streak_record = create(:streak, :weekly_review, user: user, current_count: 2, longest_count: 2,
                                                      last_activity_date: last_week)

      described_class.record_weekly_review(user: user, date: today)
      expect(streak_record.reload.current_count).to eq(2)
    end
  end

  describe ".get_all_streaks" do
    it "returns all three streak types" do
      streaks = described_class.get_all_streaks(user)

      expect(streaks.length).to eq(3)
      streak_types = streaks.map(&:streak_type)
      expect(streak_types).to contain_exactly("daily_planning", "evening_reflection", "weekly_review")
    end

    it "creates missing streaks" do
      create(:streak, :daily_planning, user: user)

      expect do
        described_class.get_all_streaks(user)
      end.to change(Streak, :count).by(2)
    end

    it "returns existing streaks unchanged" do
      existing = create(:streak, :daily_planning, user: user, current_count: 10)

      streaks = described_class.get_all_streaks(user)
      planning_streak = streaks.find(&:daily_planning?)

      expect(planning_streak.id).to eq(existing.id)
      expect(planning_streak.current_count).to eq(10)
    end
  end

  describe ".check_and_reset_broken_streaks" do
    context "when daily streak is broken" do
      let!(:broken_streak) do
        create(:streak, :daily_planning, user: user, current_count: 5, longest_count: 10,
                                         last_activity_date: today - 3.days)
      end

      it "resets current_count to 0" do
        described_class.check_and_reset_broken_streaks(user, current_date: today)
        expect(broken_streak.reload.current_count).to eq(0)
      end

      it "preserves longest_count" do
        described_class.check_and_reset_broken_streaks(user, current_date: today)
        expect(broken_streak.reload.longest_count).to eq(10)
      end
    end

    context "when streak is not broken" do
      let!(:active_streak) do
        create(:streak, :daily_planning, user: user, current_count: 5, longest_count: 10,
                                         last_activity_date: today - 1.day)
      end

      it "does not reset current_count" do
        described_class.check_and_reset_broken_streaks(user, current_date: today)
        expect(active_streak.reload.current_count).to eq(5)
      end
    end

    context "when weekly review streak is checked" do
      let!(:weekly_streak) do
        create(:streak, :weekly_review, user: user, current_count: 4, longest_count: 8,
                                        last_activity_date: today - 8.days)
      end

      it "resets when more than 7 days have passed" do
        described_class.check_and_reset_broken_streaks(user, current_date: today)
        expect(weekly_streak.reload.current_count).to eq(0)
      end
    end
  end
end
