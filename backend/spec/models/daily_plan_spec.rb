# frozen_string_literal: true

require "rails_helper"

RSpec.describe DailyPlan do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:family) }
    it { is_expected.to have_many(:daily_tasks).dependent(:destroy) }
    it { is_expected.to have_many(:top_priorities).dependent(:destroy) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:date) }

    describe "uniqueness of date per user and family" do
      subject(:daily_plan) { create(:daily_plan) }

      it "validates uniqueness scoped to user and family" do
        expect(daily_plan).to validate_uniqueness_of(:date)
          .scoped_to(%i[user_id family_id])
          .with_message(:already_exists_for_date)
      end
    end
  end

  describe "nested attributes" do
    it { is_expected.to accept_nested_attributes_for(:daily_tasks).allow_destroy(true) }
    it { is_expected.to accept_nested_attributes_for(:top_priorities).allow_destroy(true) }
  end

  describe ".find_or_create_for_today" do
    let(:user) { create(:user) }
    let(:family) { create(:family, timezone: "America/New_York") }

    context "when no plan exists for today" do
      it "creates a new plan" do
        expect do
          described_class.find_or_create_for_today(user: user, family: family)
        end.to change(described_class, :count).by(1)
      end

      it "returns the created plan" do
        plan = described_class.find_or_create_for_today(user: user, family: family)
        expect(plan).to be_persisted
        expect(plan.user).to eq(user)
        expect(plan.family).to eq(family)
      end
    end

    context "when a plan already exists for today" do
      let!(:existing_plan) do
        today = Time.find_zone("America/New_York").today
        create(:daily_plan, user: user, family: family, date: today)
      end

      it "does not create a new plan" do
        expect do
          described_class.find_or_create_for_today(user: user, family: family)
        end.not_to change(described_class, :count)
      end

      it "returns the existing plan" do
        plan = described_class.find_or_create_for_today(user: user, family: family)
        expect(plan.id).to eq(existing_plan.id)
      end
    end
  end

  describe "#yesterday_incomplete_tasks" do
    let(:user) { create(:user) }
    let(:family) { create(:family) }
    let(:today_plan) { create(:daily_plan, user: user, family: family, date: Time.zone.today) }

    context "when there is no yesterday plan" do
      it "returns an empty array" do
        expect(today_plan.yesterday_incomplete_tasks).to eq([])
      end
    end

    context "when yesterday plan exists with incomplete tasks" do
      let!(:yesterday_plan) { create(:daily_plan, user: user, family: family, date: Time.zone.yesterday) }

      it "returns only incomplete tasks" do
        incomplete_task = create(:daily_task, :incomplete, daily_plan: yesterday_plan, position: 0)
        create(:daily_task, :completed, daily_plan: yesterday_plan, position: 1)

        result = today_plan.yesterday_incomplete_tasks
        expect(result).to contain_exactly(incomplete_task)
      end
    end
  end

  describe "#completion_stats" do
    let(:daily_plan) { create(:daily_plan) }

    context "when there are no priorities or habit completions" do
      it "returns zero stats" do
        expect(daily_plan.completion_stats).to eq(total: 0, completed: 0, percentage: 0)
      end
    end

    context "when there are priorities and habits" do
      before do
        create(:top_priority, daily_plan: daily_plan, title: "Priority 1", priority_order: 1, completed: true)
        create(:top_priority, daily_plan: daily_plan, title: "Priority 2", priority_order: 2, completed: false)
        habit = create(:habit, user: daily_plan.user, family: daily_plan.family)
        create(:habit_completion, daily_plan: daily_plan, habit: habit, completed: true)
      end

      it "returns correct stats for priorities and habits combined" do
        expect(daily_plan.completion_stats).to eq(total: 3, completed: 2, percentage: 67)
      end
    end

    context "when all priorities and habits are completed" do
      before do
        create(:top_priority, daily_plan: daily_plan, title: "Priority 1", priority_order: 1, completed: true)
        create(:top_priority, daily_plan: daily_plan, title: "Priority 2", priority_order: 2, completed: true)
        habit = create(:habit, user: daily_plan.user, family: daily_plan.family)
        create(:habit_completion, daily_plan: daily_plan, habit: habit, completed: true)
      end

      it "returns 100 percent" do
        expect(daily_plan.completion_stats).to eq(total: 3, completed: 3, percentage: 100)
      end
    end

    context "when priorities have empty titles" do
      before do
        create(:top_priority, daily_plan: daily_plan, title: "Real priority", priority_order: 1, completed: true)
        # Empty title priorities should not be counted
      end

      it "excludes priorities with empty titles" do
        expect(daily_plan.completion_stats).to eq(total: 1, completed: 1, percentage: 100)
      end
    end
  end

  describe "scopes" do
    describe ".for_date" do
      it "returns plans for the specified date" do
        today_plan = create(:daily_plan, date: Time.zone.today)
        create(:daily_plan, date: Time.zone.yesterday)

        expect(described_class.for_date(Time.zone.today)).to contain_exactly(today_plan)
      end
    end
  end
end
