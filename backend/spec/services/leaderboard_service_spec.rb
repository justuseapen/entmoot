# frozen_string_literal: true

require "rails_helper"

RSpec.describe LeaderboardService do
  describe ".get_leaderboard" do
    let(:family) { create(:family) }
    let(:alice) { create(:user, name: "Alice") }
    let(:bob) { create(:user, name: "Bob") }
    let(:charlie) { create(:user, name: "Charlie") }

    before do
      create(:family_membership, family: family, user: alice, role: :admin)
      create(:family_membership, family: family, user: bob, role: :adult)
      create(:family_membership, family: family, user: charlie, role: :teen)
    end

    context "with all_time scope" do
      it "returns all family members ranked by total points" do
        create(:points_ledger_entry, user: alice, points: 100, activity_type: "complete_task")
        create(:points_ledger_entry, user: bob, points: 50, activity_type: "complete_task")
        create(:points_ledger_entry, user: charlie, points: 75, activity_type: "complete_task")

        leaderboard = described_class.get_leaderboard(family)

        expect(leaderboard.pluck(:name)).to eq(%w[Alice Charlie Bob])
        expect(leaderboard.pluck(:points)).to eq([100, 75, 50])
        expect(leaderboard.pluck(:rank)).to eq([1, 2, 3])
      end

      it "returns correct user info in entry" do
        create(:points_ledger_entry, user: alice, points: 100, activity_type: "complete_task")

        leaderboard = described_class.get_leaderboard(family)
        entry = leaderboard.find { |e| e[:user_id] == alice.id }

        expect(entry).to include(user_id: alice.id, name: "Alice", points: 100, rank: 1)
      end

      it "returns correct streak info in entry" do
        create(:streak, user: alice, streak_type: :daily_planning, current_count: 5)

        leaderboard = described_class.get_leaderboard(family)
        entry = leaderboard.find { |e| e[:user_id] == alice.id }

        expect(entry[:streaks]).to include(daily_planning: 5, evening_reflection: 0, total: 5)
      end

      it "returns correct badges count in entry" do
        create(:user_badge, user: alice)

        leaderboard = described_class.get_leaderboard(family)
        entry = leaderboard.find { |e| e[:user_id] == alice.id }

        expect(entry[:badges_count]).to eq(1)
      end
    end

    context "with weekly scope" do
      it "returns members ranked by weekly points only" do
        # Create points from last week (should not count)
        travel_to 2.weeks.ago do
          create(:points_ledger_entry, user: alice, points: 1000, activity_type: "complete_task")
        end

        # Create points from this week (should count)
        create(:points_ledger_entry, user: bob, points: 50, activity_type: "complete_task")
        create(:points_ledger_entry, user: charlie, points: 75, activity_type: "complete_task")

        leaderboard = described_class.get_leaderboard(family, scope: :weekly)

        expect(leaderboard.pluck(:name)).to eq(%w[Charlie Bob Alice])
        expect(leaderboard.pluck(:points)).to eq([75, 50, 0])
      end
    end

    context "with tied points" do
      it "ranks tied users equally and sorts alphabetically" do
        create(:points_ledger_entry, user: alice, points: 100, activity_type: "complete_task")
        create(:points_ledger_entry, user: bob, points: 100, activity_type: "complete_task")
        create(:points_ledger_entry, user: charlie, points: 50, activity_type: "complete_task")

        leaderboard = described_class.get_leaderboard(family)

        # Alice and Bob tied at rank 1, sorted alphabetically
        expect(leaderboard.pluck(:name)).to eq(%w[Alice Bob Charlie])
        expect(leaderboard.pluck(:rank)).to eq([1, 1, 3])
      end
    end

    context "with no points" do
      it "returns all members with zero points" do
        leaderboard = described_class.get_leaderboard(family)

        expect(leaderboard.pluck(:points)).to eq([0, 0, 0])
        expect(leaderboard.pluck(:rank)).to eq([1, 1, 1])
      end
    end

    context "with streaks" do
      it "includes all streak types in the summary" do
        create(:streak, user: alice, streak_type: :daily_planning, current_count: 7)
        create(:streak, user: alice, streak_type: :evening_reflection, current_count: 5)
        create(:streak, user: alice, streak_type: :weekly_review, current_count: 3)

        leaderboard = described_class.get_leaderboard(family)
        entry = leaderboard.find { |e| e[:user_id] == alice.id }

        expect(entry[:streaks]).to eq(
          daily_planning: 7,
          evening_reflection: 5,
          weekly_review: 3,
          total: 15
        )
      end
    end

    context "with badges" do
      it "counts the correct number of badges for each user" do
        3.times { create(:user_badge, user: alice) }
        create(:user_badge, user: bob)

        leaderboard = described_class.get_leaderboard(family)

        alice_entry = leaderboard.find { |e| e[:user_id] == alice.id }
        bob_entry = leaderboard.find { |e| e[:user_id] == bob.id }
        charlie_entry = leaderboard.find { |e| e[:user_id] == charlie.id }

        expect(alice_entry[:badges_count]).to eq(3)
        expect(bob_entry[:badges_count]).to eq(1)
        expect(charlie_entry[:badges_count]).to eq(0)
      end
    end
  end
end
