# frozen_string_literal: true

require "rails_helper"

RSpec.describe BadgeService do
  let(:user) { create(:user) }
  let(:family) { create(:family) }

  before do
    create(:family_membership, user: user, family: family, role: :admin)
    # Stub NotificationService to avoid side effects
    allow(NotificationService).to receive(:notify_badge_earned)
  end

  describe ".check_all_badges" do
    let(:first_goal_badge) { create(:badge, :first_goal) }
    let(:goal_setter_badge) { create(:badge, :goal_setter) }

    context "when user has created goals" do
      before do
        first_goal_badge
        goal_setter_badge
        create_list(:goal, 2, creator: user, family: family)
      end

      it "awards eligible badges" do
        awarded = described_class.check_all_badges(user)
        expect(awarded.map(&:name)).to include("first_goal")
        expect(awarded.map(&:name)).not_to include("goal_setter")
      end

      it "does not award already earned badges" do
        create(:user_badge, user: user, badge: first_goal_badge)
        awarded = described_class.check_all_badges(user)
        expect(awarded.map(&:name)).not_to include("first_goal")
      end
    end

    context "when user has 5+ goals" do
      before do
        first_goal_badge
        goal_setter_badge
        create_list(:goal, 5, creator: user, family: family)
      end

      it "awards the goal_setter badge" do
        awarded = described_class.check_all_badges(user)
        expect(awarded.map(&:name)).to include("goal_setter")
      end
    end
  end

  describe ".check_goal_badges" do
    let(:first_goal_badge) { create(:badge, :first_goal) }
    let(:first_plan_badge) { create(:badge, :first_plan) }

    before do
      first_goal_badge
      first_plan_badge
      create(:goal, creator: user, family: family)
    end

    it "only checks badges in the goals category" do
      awarded = described_class.check_goal_badges(user)
      expect(awarded).to include(first_goal_badge)
      expect(awarded).not_to include(first_plan_badge)
    end
  end

  describe ".check_planning_badges" do
    let(:first_plan_badge) { create(:badge, :first_plan) }

    before { first_plan_badge }

    context "when user has daily plans with tasks" do
      before do
        plan = create(:daily_plan, user: user, family: family)
        create(:daily_task, daily_plan: plan)
      end

      it "awards the first_plan badge" do
        awarded = described_class.check_planning_badges(user)
        expect(awarded).to include(first_plan_badge)
      end
    end

    context "when user has no daily plans with tasks" do
      it "does not award the first_plan badge" do
        awarded = described_class.check_planning_badges(user)
        expect(awarded).not_to include(first_plan_badge)
      end
    end
  end

  describe ".check_reflection_badges" do
    let(:first_reflection_badge) { create(:badge, :first_reflection) }

    before { first_reflection_badge }

    context "when user has reflections" do
      before do
        plan = create(:daily_plan, user: user, family: family)
        create(:reflection, daily_plan: plan)
      end

      it "awards the first_reflection badge" do
        awarded = described_class.check_reflection_badges(user)
        expect(awarded).to include(first_reflection_badge)
      end
    end

    context "when user has no reflections" do
      it "does not award the first_reflection badge" do
        awarded = described_class.check_reflection_badges(user)
        expect(awarded).not_to include(first_reflection_badge)
      end
    end
  end

  describe ".check_streak_badges" do
    let(:week_warrior_badge) { create(:badge, :week_warrior) }

    before { week_warrior_badge }

    context "when user has a 7+ day streak" do
      before do
        create(:streak, user: user, streak_type: :daily_planning, current_count: 7, longest_count: 10)
      end

      it "awards the week_warrior badge" do
        awarded = described_class.check_streak_badges(user)
        expect(awarded).to include(week_warrior_badge)
      end
    end

    context "when user has no streak" do
      it "does not award the week_warrior badge" do
        awarded = described_class.check_streak_badges(user)
        expect(awarded).not_to include(week_warrior_badge)
      end
    end
  end

  describe ".award_badge" do
    let(:badge) { create(:badge, :first_goal) }

    it "creates a user_badge record" do
      expect { described_class.award_badge(user, badge) }
        .to change(UserBadge, :count).by(1)
    end

    it "sends a notification" do
      described_class.award_badge(user, badge)
      expect(NotificationService).to have_received(:notify_badge_earned)
        .with(user: user, badge_name: badge.name)
    end

    it "returns the user_badge" do
      result = described_class.award_badge(user, badge)
      expect(result).to be_a(UserBadge)
      expect(result.badge).to eq(badge)
    end

    context "when badge is already earned" do
      before { create(:user_badge, user: user, badge: badge) }

      it "returns nil" do
        result = described_class.award_badge(user, badge)
        expect(result).to be_nil
      end

      it "does not create a duplicate" do
        expect { described_class.award_badge(user, badge) }
          .not_to change(UserBadge, :count)
      end

      it "does not send a notification" do
        described_class.award_badge(user, badge)
        expect(NotificationService).not_to have_received(:notify_badge_earned)
      end
    end
  end

  describe ".badges_for_user" do
    let(:first_goal_badge) { create(:badge, :first_goal) }
    let(:goal_setter_badge) { create(:badge, :goal_setter) }

    before do
      first_goal_badge
      goal_setter_badge
      create(:user_badge, user: user, badge: first_goal_badge, earned_at: 3.days.ago)
    end

    it "returns all badges with earned status" do
      result = described_class.badges_for_user(user)

      first_goal_result = result.find { |r| r[:badge] == first_goal_badge }
      goal_setter_result = result.find { |r| r[:badge] == goal_setter_badge }

      expect(first_goal_result[:earned]).to be true
      expect(first_goal_result[:earned_at]).to be_present

      expect(goal_setter_result[:earned]).to be false
      expect(goal_setter_result[:earned_at]).to be_nil
    end
  end
end
