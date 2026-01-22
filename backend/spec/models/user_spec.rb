# frozen_string_literal: true

require "rails_helper"

RSpec.describe User do
  describe "validations" do
    subject { build(:user) }

    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:password) }
    it { is_expected.to validate_length_of(:password).is_at_least(6) }
  end

  describe "associations" do
    it { is_expected.to have_many(:refresh_tokens).dependent(:destroy) }
  end

  describe "devise modules" do
    it "uses database_authenticatable" do
      expect(described_class.devise_modules).to include(:database_authenticatable)
    end

    it "uses registerable" do
      expect(described_class.devise_modules).to include(:registerable)
    end

    it "uses recoverable" do
      expect(described_class.devise_modules).to include(:recoverable)
    end

    it "uses rememberable" do
      expect(described_class.devise_modules).to include(:rememberable)
    end

    it "uses validatable" do
      expect(described_class.devise_modules).to include(:validatable)
    end
  end

  describe "#onboarding_required?" do
    let(:user) { create(:user) }

    it "returns true for new user with no data" do
      expect(user.onboarding_required?).to be true
    end

    it "returns false when onboarding is already completed" do
      user.update!(onboarding_wizard_completed_at: Time.current)
      expect(user.onboarding_required?).to be false
    end

    it "returns true when user has family but no goals" do
      family = create(:family)
      create(:family_membership, user: user, family: family)

      expect(user.onboarding_required?).to be true
    end

    it "returns true when user has goals but no family" do
      # Create a goal without family context (edge case)
      another_user = create(:user)
      family = create(:family)
      create(:family_membership, user: another_user, family: family)
      create(:goal, creator: user, family: family)

      expect(user.onboarding_required?).to be true
    end

    it "returns false when user has both family and goals" do
      family = create(:family)
      create(:family_membership, user: user, family: family)
      create(:goal, creator: user, family: family)

      expect(user.onboarding_required?).to be false
    end

    it "returns false when onboarding is completed even without family or goals" do
      user.update!(onboarding_wizard_completed_at: Time.current)
      expect(user.onboarding_required?).to be false
    end
  end

  describe "first actions" do
    let(:user) { create(:user, first_actions: {}) }

    describe "FIRST_ACTION_TYPES" do
      it "defines the expected action types" do
        expect(described_class::FIRST_ACTION_TYPES).to eq(
          %w[goal_created reflection_completed daily_plan_completed invitation_accepted]
        )
      end
    end

    describe "#first_action_completed?" do
      it "returns false when action has not been completed" do
        expect(user.first_action_completed?(:goal_created)).to be false
      end

      it "returns true when action has been completed" do
        user.update!(first_actions: { "goal_created" => Time.current.iso8601 })
        expect(user.first_action_completed?(:goal_created)).to be true
      end

      it "works with string keys" do
        user.update!(first_actions: { "goal_created" => Time.current.iso8601 })
        expect(user.first_action_completed?("goal_created")).to be true
      end
    end

    describe "#record_first_action?" do
      it "records a new first action and returns true" do
        result = user.record_first_action?(:goal_created)

        expect(result).to be true
        expect(user.reload.first_actions).to have_key("goal_created")
      end

      it "returns false if action is already completed" do
        user.update!(first_actions: { "goal_created" => Time.current.iso8601 })

        result = user.record_first_action?(:goal_created)

        expect(result).to be false
      end

      it "returns false for invalid action types" do
        result = user.record_first_action?(:invalid_action)

        expect(result).to be false
      end

      it "stores the timestamp in ISO8601 format" do
        freeze_time do
          user.record_first_action?(:goal_created)

          expect(user.reload.first_actions["goal_created"]).to eq(Time.current.iso8601)
        end
      end

      it "preserves existing first actions when adding a new one" do
        user.update!(first_actions: { "goal_created" => "2026-01-01T12:00:00Z" })
        user.record_first_action?(:reflection_completed)

        expect(user.reload.first_actions).to have_key("goal_created")
        expect(user.first_actions).to have_key("reflection_completed")
      end
    end
  end
end
