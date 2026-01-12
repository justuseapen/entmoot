# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserBadge do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:badge) }
  end

  describe "validations" do
    subject { build(:user_badge) }

    # NOTE: earned_at presence validation cannot be tested with shoulda-matchers
    # because before_validation callback sets it automatically. Tested in callbacks section.
    it { is_expected.to validate_uniqueness_of(:user_id).scoped_to(:badge_id).with_message(:already_earned) }
  end

  describe "scopes" do
    let(:user) { create(:user) }
    let!(:recent_badge) { create(:user_badge, user: user, earned_at: 1.day.ago) }
    let!(:old_badge) { create(:user_badge, user: user, earned_at: 30.days.ago) }

    describe ".recent" do
      it "orders by earned_at descending" do
        expect(described_class.recent.first).to eq(recent_badge)
        expect(described_class.recent.last).to eq(old_badge)
      end
    end

    describe ".for_user" do
      let(:other_user) { create(:user) }
      let!(:other_badge) { create(:user_badge, user: other_user) }

      it "returns only badges for the specified user" do
        expect(described_class.for_user(user)).to include(recent_badge, old_badge)
        expect(described_class.for_user(user)).not_to include(other_badge)
      end
    end
  end

  describe "callbacks" do
    describe "#set_earned_at" do
      context "when earned_at is not provided" do
        it "sets earned_at to current time" do
          freeze_time do
            user_badge = create(:user_badge, earned_at: nil)
            expect(user_badge.earned_at).to be_within(1.second).of(Time.current)
          end
        end
      end

      context "when earned_at is provided" do
        it "keeps the provided earned_at time" do
          specific_time = 5.days.ago
          user_badge = create(:user_badge, earned_at: specific_time)
          expect(user_badge.earned_at).to be_within(1.second).of(specific_time)
        end
      end
    end
  end
end
