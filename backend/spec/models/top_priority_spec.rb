# frozen_string_literal: true

require "rails_helper"

RSpec.describe TopPriority do
  describe "associations" do
    it { is_expected.to belong_to(:daily_plan) }
    it { is_expected.to belong_to(:goal).optional }
    it { is_expected.to have_many(:mentions).dependent(:destroy) }
  end

  describe "Mentionable concern" do
    let(:family) { create(:family) }
    let(:user) { create(:user, name: "Alice Smith") }
    let(:bob) { create(:user, name: "Bob Jones") }
    let(:daily_plan) { create(:daily_plan, user: user, family: family) }

    before do
      create(:family_membership, family: family, user: user, role: :admin)
      create(:family_membership, family: family, user: bob, role: :adult)
    end

    it "defines mentionable_fields as :title" do
      expect(described_class.mentionable_text_fields).to eq([:title])
    end

    it "creates mentions when saving with @mentions in title" do
      priority = described_class.create!(
        daily_plan: daily_plan,
        title: "Work with @bob on project",
        priority_order: 1
      )

      expect(priority.mentions.count).to eq(1)
      expect(priority.mentions.first.mentioned_user).to eq(bob)
      expect(priority.mentions.first.user).to eq(user)
      expect(priority.mentions.first.text_field).to eq("title")
    end

    it "gets family_id through daily_plan association" do
      priority = create(:top_priority, daily_plan: daily_plan)
      expect(priority.send(:mentionable_family_id)).to eq(family.id)
    end
  end

  describe "validations" do
    subject { build(:top_priority) }

    it { is_expected.to validate_presence_of(:title) }
    it { is_expected.to validate_presence_of(:priority_order) }
    it { is_expected.to validate_numericality_of(:priority_order).only_integer }

    it "validates priority_order is between 1 and 3" do
      expect(build(:top_priority, priority_order: 0)).not_to be_valid
      expect(build(:top_priority, priority_order: 1)).to be_valid
      expect(build(:top_priority, priority_order: 3)).to be_valid
      expect(build(:top_priority, priority_order: 4)).not_to be_valid
    end

    describe "uniqueness of priority_order per daily_plan" do
      subject(:top_priority) { create(:top_priority) }

      it "validates uniqueness scoped to daily plan" do
        expect(top_priority).to validate_uniqueness_of(:priority_order)
          .scoped_to(:daily_plan_id)
          .with_message(:already_exists)
      end
    end
  end

  describe "max priorities per plan" do
    let(:daily_plan) { create(:daily_plan) }

    before do
      create(:top_priority, daily_plan: daily_plan, priority_order: 1)
      create(:top_priority, daily_plan: daily_plan, priority_order: 2)
      create(:top_priority, daily_plan: daily_plan, priority_order: 3)
    end

    it "prevents adding more than 3 priorities" do
      # Attempting to create a 4th priority (which would require order > 3)
      priority = build(:top_priority, daily_plan: daily_plan, priority_order: 4)
      expect(priority).not_to be_valid
      expect(priority.errors[:priority_order]).to be_present
    end
  end

  describe "scopes" do
    let(:daily_plan) { create(:daily_plan) }
    let!(:third_priority) { create(:top_priority, :third, daily_plan: daily_plan) }
    let!(:first_priority) { create(:top_priority, daily_plan: daily_plan, priority_order: 1) }
    let!(:second_priority) { create(:top_priority, :second, daily_plan: daily_plan) }

    describe ".ordered" do
      it "returns priorities in order" do
        expect(described_class.ordered.to_a).to eq([first_priority, second_priority, third_priority])
      end
    end
  end
end
