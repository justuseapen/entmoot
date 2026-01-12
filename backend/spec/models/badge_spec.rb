# frozen_string_literal: true

require "rails_helper"

RSpec.describe Badge do
  describe "associations" do
    it { is_expected.to have_many(:user_badges).dependent(:destroy) }
    it { is_expected.to have_many(:users).through(:user_badges) }
  end

  describe "validations" do
    subject { build(:badge) }

    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_uniqueness_of(:name) }
    it { is_expected.to validate_presence_of(:description) }
    it { is_expected.to validate_presence_of(:icon) }
    it { is_expected.to validate_presence_of(:category) }
    it { is_expected.to validate_inclusion_of(:category).in_array(Badge::CATEGORIES) }
    it { is_expected.to validate_presence_of(:criteria) }
  end

  describe "scopes" do
    describe ".by_category" do
      let!(:goals_badge) { create(:badge, :goals) }
      let!(:planning_badge) { create(:badge, :planning) }

      it "returns badges in the specified category" do
        expect(described_class.by_category("goals")).to include(goals_badge)
        expect(described_class.by_category("goals")).not_to include(planning_badge)
      end
    end
  end

  describe "#earned_by?" do
    let(:badge) { create(:badge) }
    let(:user) { create(:user) }

    context "when user has earned the badge" do
      before { create(:user_badge, user: user, badge: badge) }

      it "returns true" do
        expect(badge.earned_by?(user)).to be true
      end
    end

    context "when user has not earned the badge" do
      it "returns false" do
        expect(badge.earned_by?(user)).to be false
      end
    end
  end

  describe "#criterion_value" do
    let(:badge) { create(:badge, criteria: { "type" => "goal_count", "count" => 5 }) }

    it "returns the value for the given criterion key" do
      expect(badge.criterion_value(:type)).to eq("goal_count")
      expect(badge.criterion_value(:count)).to eq(5)
    end

    it "returns nil for non-existent keys" do
      expect(badge.criterion_value(:nonexistent)).to be_nil
    end
  end
end
