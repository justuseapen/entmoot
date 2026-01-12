# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reflection do
  describe "associations" do
    # NOTE: daily_plan is optional at the model level but required for non-quick reflections via validation
    it { is_expected.to belong_to(:daily_plan).without_validating_presence }
    it { is_expected.to belong_to(:user).without_validating_presence }
    it { is_expected.to belong_to(:family).without_validating_presence }
    it { is_expected.to have_many(:reflection_responses).dependent(:destroy) }
  end

  describe "validations" do
    subject { build(:reflection) }

    it { is_expected.to validate_presence_of(:reflection_type) }

    it "validates uniqueness of reflection_type scoped to daily_plan_id" do
      daily_plan = create(:daily_plan)
      create(:reflection, daily_plan: daily_plan, reflection_type: :evening)

      duplicate = build(:reflection, daily_plan: daily_plan, reflection_type: :evening)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:reflection_type]).to include("already has a reflection of this type for this day")
    end

    it "allows different reflection types for same daily plan" do
      daily_plan = create(:daily_plan)
      create(:reflection, daily_plan: daily_plan, reflection_type: :evening)

      weekly = build(:reflection, daily_plan: daily_plan, reflection_type: :weekly)
      expect(weekly).to be_valid
    end

    it { is_expected.to validate_numericality_of(:energy_level).is_in(1..5).allow_nil }

    context "with non-quick reflection" do
      subject { build(:reflection, reflection_type: :evening) }

      it { is_expected.to validate_presence_of(:daily_plan) }
    end

    context "with quick reflection" do
      subject { build(:reflection, :quick) }

      it { is_expected.to validate_presence_of(:user) }
      it { is_expected.to validate_presence_of(:family) }
    end
  end

  describe "enums" do
    subject(:reflection) { build(:reflection) }

    it "defines reflection_type enum" do
      expect(reflection).to define_enum_for(:reflection_type)
        .with_values(evening: 0, weekly: 1, monthly: 2, quarterly: 3, annual: 4, quick: 5)
    end

    it "defines mood enum with prefix" do
      expect(reflection).to define_enum_for(:mood)
        .with_values(great: 0, good: 1, okay: 2, difficult: 3, rough: 4)
        .with_prefix(:mood)
        .backed_by_column_of_type(:integer)
    end
  end

  describe "nested attributes" do
    it "accepts nested attributes for reflection_responses" do
      reflection = create(:reflection)
      reflection.update(
        reflection_responses_attributes: [
          { prompt: "What went well?", response: "Many things!" }
        ]
      )

      expect(reflection.reflection_responses.count).to eq(1)
      expect(reflection.reflection_responses.first.response).to eq("Many things!")
    end

    it "allows destroying reflection responses via nested attributes" do
      reflection = create(:reflection, :with_responses)
      response = reflection.reflection_responses.first

      reflection.update(
        reflection_responses_attributes: [
          { id: response.id, _destroy: true }
        ]
      )

      expect(reflection.reflection_responses.count).to eq(1)
    end
  end

  describe "#completed?" do
    it "returns false when no responses have content" do
      reflection = create(:reflection)
      create(:reflection_response, :unanswered, reflection: reflection)

      expect(reflection.completed?).to be(false)
    end

    it "returns true when at least one response has content" do
      reflection = create(:reflection)
      create(:reflection_response, :answered, reflection: reflection)

      expect(reflection.completed?).to be(true)
    end

    it "returns false when no responses exist" do
      reflection = create(:reflection)

      expect(reflection.completed?).to be(false)
    end
  end

  describe "#effective_user and #effective_family" do
    context "with daily_plan-based reflection" do
      let(:user) { create(:user) }
      let(:family) { create(:family) }
      let(:daily_plan) { create(:daily_plan, user: user, family: family) }
      let(:reflection) { create(:reflection, daily_plan: daily_plan) }

      it "returns user from daily_plan" do
        expect(reflection.effective_user).to eq(user)
      end

      it "returns family from daily_plan" do
        expect(reflection.effective_family).to eq(family)
      end
    end

    context "with quick reflection" do
      let(:user) { create(:user) }
      let(:family) { create(:family) }
      let(:reflection) { create(:reflection, :quick, user: user, family: family) }

      it "returns direct user association" do
        expect(reflection.effective_user).to eq(user)
      end

      it "returns direct family association" do
        expect(reflection.effective_family).to eq(family)
      end
    end
  end

  describe "gratitude_items" do
    it "stores an array of gratitude items" do
      reflection = create(:reflection, gratitude_items: ["Family", "Health", "Good weather"])

      expect(reflection.gratitude_items).to eq(["Family", "Health", "Good weather"])
    end

    it "defaults to empty array" do
      reflection = create(:reflection)

      expect(reflection.gratitude_items).to eq([])
    end
  end
end
