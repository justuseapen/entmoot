# frozen_string_literal: true

require "rails_helper"

RSpec.describe DailyTask do
  describe "associations" do
    it { is_expected.to belong_to(:daily_plan) }
    it { is_expected.to belong_to(:goal).optional }
    it { is_expected.to belong_to(:assignee).class_name("User").optional }
  end

  describe "validations" do
    subject { build(:daily_task) }

    it { is_expected.to validate_presence_of(:title) }
    it { is_expected.to validate_numericality_of(:position).only_integer.is_greater_than_or_equal_to(0) }
  end

  describe "scopes" do
    let(:daily_plan) { create(:daily_plan) }
    let!(:completed_task) { create(:daily_task, :completed, daily_plan: daily_plan, position: 0) }
    let!(:incomplete_task) { create(:daily_task, :incomplete, daily_plan: daily_plan, position: 1) }

    describe ".completed" do
      it "returns only completed tasks" do
        expect(described_class.completed).to contain_exactly(completed_task)
      end
    end

    describe ".incomplete" do
      it "returns only incomplete tasks" do
        expect(described_class.incomplete).to contain_exactly(incomplete_task)
      end
    end

    describe ".ordered" do
      it "returns tasks in position order" do
        expect(described_class.ordered.to_a).to eq([completed_task, incomplete_task])
      end
    end
  end

  describe "default position" do
    let(:daily_plan) { create(:daily_plan) }

    context "when no tasks exist" do
      it "sets position to 0" do
        task = create(:daily_task, daily_plan: daily_plan, position: nil)
        expect(task.position).to eq(0)
      end
    end

    context "when tasks already exist" do
      before do
        create(:daily_task, daily_plan: daily_plan, position: 0)
        create(:daily_task, daily_plan: daily_plan, position: 1)
      end

      it "sets position to next available" do
        task = create(:daily_task, daily_plan: daily_plan, position: nil)
        expect(task.position).to eq(2)
      end
    end
  end

  describe "#complete!" do
    let(:task) { create(:daily_task, :incomplete) }

    it "marks the task as completed" do
      expect { task.complete! }.to change(task, :completed).from(false).to(true)
    end
  end

  describe "#uncomplete!" do
    let(:task) { create(:daily_task, :completed) }

    it "marks the task as incomplete" do
      expect { task.uncomplete! }.to change(task, :completed).from(true).to(false)
    end
  end

  describe "assignee validation" do
    let(:family) { create(:family) }
    let(:user) { create(:user) }
    let(:other_user) { create(:user) }
    let(:daily_plan) { create(:daily_plan, family: family, user: user) }

    before { create(:family_membership, family: family, user: user) }

    it "allows nil assignee" do
      task = build(:daily_task, daily_plan: daily_plan, assignee: nil)
      expect(task).to be_valid
    end

    it "allows family member as assignee" do
      create(:family_membership, family: family, user: other_user)
      task = build(:daily_task, daily_plan: daily_plan, assignee: other_user)
      expect(task).to be_valid
    end

    it "rejects non-family member as assignee" do
      task = build(:daily_task, daily_plan: daily_plan, assignee: other_user)
      expect(task).not_to be_valid
      expect(task.errors[:assignee]).to include("must be a member of the family")
    end
  end

  describe "#toggle!" do
    context "when task is incomplete" do
      let(:task) { create(:daily_task, :incomplete) }

      it "marks the task as completed" do
        expect { task.toggle! }.to change(task, :completed).from(false).to(true)
      end
    end

    context "when task is completed" do
      let(:task) { create(:daily_task, :completed) }

      it "marks the task as incomplete" do
        expect { task.toggle! }.to change(task, :completed).from(true).to(false)
      end
    end
  end
end
