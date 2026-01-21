# frozen_string_literal: true

require "rails_helper"

RSpec.describe CalendarSyncMapping do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:syncable) }
  end

  describe "validations" do
    subject { build(:calendar_sync_mapping, :for_goal) }

    it { is_expected.to validate_presence_of(:google_event_id) }
    it { is_expected.to validate_presence_of(:google_calendar_id) }

    it "validates uniqueness of google_event_id scoped to user_id" do
      user = create(:user)
      create(:calendar_sync_mapping, :for_goal, user: user, google_event_id: "event_123")

      duplicate = build(:calendar_sync_mapping, :for_goal, user: user, google_event_id: "event_123")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:google_event_id]).to include("has already been taken")
    end

    it "allows same google_event_id for different users" do
      create(:calendar_sync_mapping, :for_goal, google_event_id: "event_123")

      other_mapping = build(:calendar_sync_mapping, :for_goal, google_event_id: "event_123")
      expect(other_mapping).to be_valid
    end

    describe "syncable_type validation" do
      it "allows Goal" do
        mapping = build(:calendar_sync_mapping, :for_goal)
        expect(mapping).to be_valid
      end

      it "allows WeeklyReview" do
        mapping = build(:calendar_sync_mapping, :for_weekly_review)
        expect(mapping).to be_valid
      end

      it "allows MonthlyReview" do
        mapping = build(:calendar_sync_mapping, :for_monthly_review)
        expect(mapping).to be_valid
      end

      it "allows QuarterlyReview" do
        mapping = build(:calendar_sync_mapping, :for_quarterly_review)
        expect(mapping).to be_valid
      end

      it "allows AnnualReview" do
        mapping = build(:calendar_sync_mapping, :for_annual_review)
        expect(mapping).to be_valid
      end

      it "validates syncable_type is from allowed list" do
        # Test that the model has the inclusion validation configured
        validators = described_class.validators_on(:syncable_type)
        inclusion_validator = validators.find { |v| v.is_a?(ActiveModel::Validations::InclusionValidator) }

        expect(inclusion_validator).to be_present
        expect(inclusion_validator.options[:in]).to contain_exactly(
          "Goal", "WeeklyReview", "MonthlyReview", "QuarterlyReview", "AnnualReview"
        )
      end
    end
  end

  describe "scopes" do
    let(:user) { create(:user) }
    let!(:goal_mapping) { create(:calendar_sync_mapping, :for_goal, user: user) }
    let!(:weekly_mapping) { create(:calendar_sync_mapping, :for_weekly_review, user: user) }
    let!(:monthly_mapping) { create(:calendar_sync_mapping, :for_monthly_review, user: user) }

    describe ".for_goals" do
      it "returns only goal mappings" do
        expect(described_class.for_goals).to include(goal_mapping)
        expect(described_class.for_goals).not_to include(weekly_mapping, monthly_mapping)
      end
    end

    describe ".for_reviews" do
      it "returns only review mappings" do
        expect(described_class.for_reviews).to include(weekly_mapping, monthly_mapping)
        expect(described_class.for_reviews).not_to include(goal_mapping)
      end
    end

    describe ".stale" do
      let!(:stale_mapping) { create(:calendar_sync_mapping, :for_goal, :stale, user: user) }
      let!(:fresh_mapping) { create(:calendar_sync_mapping, :for_goal, user: user, last_synced_at: 1.hour.ago) }

      it "returns mappings not synced in the last 24 hours" do
        expect(described_class.stale).to include(stale_mapping)
        expect(described_class.stale).not_to include(fresh_mapping)
      end
    end
  end

  describe "polymorphic association" do
    it "can be associated with a Goal" do
      goal = create(:goal)
      mapping = create(:calendar_sync_mapping, syncable: goal, user: goal.creator)

      expect(mapping.syncable).to eq(goal)
      expect(mapping.syncable_type).to eq("Goal")
    end

    it "can be associated with a WeeklyReview" do
      review = create(:weekly_review)
      mapping = create(:calendar_sync_mapping, syncable: review, user: review.user)

      expect(mapping.syncable).to eq(review)
      expect(mapping.syncable_type).to eq("WeeklyReview")
    end
  end
end
