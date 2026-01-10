# frozen_string_literal: true

require "rails_helper"

RSpec.describe Goal do
  describe "associations" do
    it { is_expected.to belong_to(:family) }
    it { is_expected.to belong_to(:creator).class_name("User") }
    it { is_expected.to belong_to(:parent).class_name("Goal").optional }
    it { is_expected.to have_many(:children).class_name("Goal").with_foreign_key(:parent_id).dependent(:nullify) }
    it { is_expected.to have_many(:goal_assignments).dependent(:destroy) }
    it { is_expected.to have_many(:assignees).through(:goal_assignments).source(:user) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:title) }

    describe "progress validation" do
      let(:family) { create(:family) }
      let(:user) { create(:user) }

      before { create(:family_membership, family: family, user: user, role: :admin) }

      it "allows progress between 0 and 100" do
        goal = build(:goal, family: family, creator: user, progress: 50)
        expect(goal).to be_valid
      end

      it "rejects progress below 0" do
        goal = build(:goal, family: family, creator: user, progress: -1)
        expect(goal).not_to be_valid
        expect(goal.errors[:progress]).to be_present
      end

      it "rejects progress above 100" do
        goal = build(:goal, family: family, creator: user, progress: 101)
        expect(goal).not_to be_valid
        expect(goal.errors[:progress]).to be_present
      end

      it "rejects non-integer progress" do
        goal = build(:goal, family: family, creator: user, progress: 50.5)
        expect(goal).not_to be_valid
        expect(goal.errors[:progress]).to be_present
      end
    end
  end

  describe "enums" do
    subject(:goal) { described_class.new }

    it "defines time_scale enum" do
      expect(goal).to define_enum_for(:time_scale)
        .with_values(daily: 0, weekly: 1, monthly: 2, quarterly: 3, annual: 4)
    end

    it "defines status enum" do
      expect(goal).to define_enum_for(:status)
        .with_values(not_started: 0, in_progress: 1, at_risk: 2, completed: 3, abandoned: 4)
    end

    it "defines visibility enum" do
      expect(goal).to define_enum_for(:visibility)
        .with_values(personal: 0, shared: 1, family: 2)
    end
  end

  describe "scopes" do
    let(:family) { create(:family) }
    let(:user) { create(:user) }

    before do
      create(:family_membership, family: family, user: user, role: :admin)
    end

    describe ".by_time_scale" do
      it "filters goals by time_scale" do
        daily = create(:goal, :daily, family: family, creator: user)
        create(:goal, :weekly, family: family, creator: user)

        expect(described_class.by_time_scale("daily")).to contain_exactly(daily)
      end

      it "returns all goals when time_scale is blank" do
        create(:goal, :daily, family: family, creator: user)
        create(:goal, :weekly, family: family, creator: user)

        expect(described_class.by_time_scale(nil).count).to eq(2)
      end
    end

    describe ".by_status" do
      it "filters goals by status" do
        in_progress = create(:goal, :in_progress, family: family, creator: user)
        create(:goal, :completed, family: family, creator: user)

        expect(described_class.by_status("in_progress")).to contain_exactly(in_progress)
      end
    end

    describe ".by_visibility" do
      it "filters goals by visibility" do
        personal = create(:goal, :personal, family: family, creator: user)
        create(:goal, :family_visible, family: family, creator: user)

        expect(described_class.by_visibility("personal")).to contain_exactly(personal)
      end
    end

    describe ".by_assignee" do
      it "filters goals by assignee" do
        assignee = create(:user)
        create(:family_membership, family: family, user: assignee, role: :adult)

        assigned_goal = create(:goal, family: family, creator: user)
        assigned_goal.assign_user(assignee)
        create(:goal, family: family, creator: user)

        expect(described_class.by_assignee(assignee.id)).to contain_exactly(assigned_goal)
      end
    end
  end

  describe "#assign_user" do
    let(:family) { create(:family) }
    let(:user) { create(:user) }
    let(:goal) { create(:goal, family: family, creator: user) }

    before do
      create(:family_membership, family: family, user: user, role: :admin)
    end

    it "creates a goal assignment" do
      expect { goal.assign_user(user) }.to change { goal.goal_assignments.count }.by(1)
    end

    it "does not duplicate assignments" do
      goal.assign_user(user)
      expect { goal.assign_user(user) }.not_to(change { goal.goal_assignments.count })
    end
  end

  describe "#unassign_user" do
    let(:family) { create(:family) }
    let(:user) { create(:user) }
    let(:goal) { create(:goal, family: family, creator: user) }

    before do
      create(:family_membership, family: family, user: user, role: :admin)
      goal.assign_user(user)
    end

    it "removes the goal assignment" do
      expect { goal.unassign_user(user) }.to change { goal.goal_assignments.count }.by(-1)
    end

    it "returns nil if user not assigned" do
      other_user = create(:user)
      expect(goal.unassign_user(other_user)).to be_nil
    end
  end

  describe "#assigned_to?" do
    let(:family) { create(:family) }
    let(:user) { create(:user) }
    let(:other_user) { create(:user) }
    let(:goal) { create(:goal, family: family, creator: user) }

    before do
      create(:family_membership, family: family, user: user, role: :admin)
      goal.assign_user(user)
    end

    it "returns true if user is assigned" do
      expect(goal.assigned_to?(user)).to be true
    end

    it "returns false if user is not assigned" do
      expect(goal.assigned_to?(other_user)).to be false
    end
  end

  describe "#visible_to?" do
    let(:family) { create(:family) }
    let(:creator) { create(:user) }
    let(:family_member) { create(:user) }
    let(:non_member) { create(:user) }

    before do
      create(:family_membership, family: family, user: creator, role: :admin)
      create(:family_membership, family: family, user: family_member, role: :adult)
    end

    context "with personal visibility" do
      let(:goal) { create(:goal, :personal, family: family, creator: creator) }

      it "is visible to the creator" do
        expect(goal.visible_to?(creator)).to be true
      end

      it "is not visible to other family members" do
        expect(goal.visible_to?(family_member)).to be false
      end

      it "is not visible to non-members" do
        expect(goal.visible_to?(non_member)).to be false
      end
    end

    context "with shared visibility" do
      let(:goal) { create(:goal, :shared, family: family, creator: creator) }

      it "is visible to the creator" do
        expect(goal.visible_to?(creator)).to be true
      end

      it "is visible to assigned family members" do
        goal.assign_user(family_member)
        expect(goal.visible_to?(family_member)).to be true
      end

      it "is not visible to unassigned family members" do
        expect(goal.visible_to?(family_member)).to be false
      end

      it "is not visible to non-members" do
        expect(goal.visible_to?(non_member)).to be false
      end
    end

    context "with family visibility" do
      let(:goal) { create(:goal, :family_visible, family: family, creator: creator) }

      it "is visible to the creator" do
        expect(goal.visible_to?(creator)).to be true
      end

      it "is visible to all family members" do
        expect(goal.visible_to?(family_member)).to be true
      end

      it "is not visible to non-members" do
        expect(goal.visible_to?(non_member)).to be false
      end
    end
  end

  describe "parent-child relationship" do
    let(:family) { create(:family) }
    let(:user) { create(:user) }

    before do
      create(:family_membership, family: family, user: user, role: :admin)
    end

    it "allows linking to a parent goal" do
      parent_goal = create(:goal, :annual, family: family, creator: user)
      child_goal = create(:goal, :monthly, family: family, creator: user, parent: parent_goal)

      expect(child_goal.parent).to eq(parent_goal)
      expect(parent_goal.children).to include(child_goal)
    end

    it "nullifies children when parent is destroyed" do
      parent_goal = create(:goal, :annual, family: family, creator: user)
      child_goal = create(:goal, :monthly, family: family, creator: user, parent: parent_goal)

      parent_goal.destroy
      child_goal.reload

      expect(child_goal.parent_id).to be_nil
    end
  end

  describe "SMART fields" do
    let(:family) { create(:family) }
    let(:user) { create(:user) }

    before do
      create(:family_membership, family: family, user: user, role: :admin)
    end

    it "stores all SMART fields correctly" do
      goal = create(:goal, :with_smart, family: family, creator: user)

      expect(goal).to have_attributes(
        specific: "Complete the quarterly sales report by analyzing Q4 data",
        measurable: "Track number of sections completed out of 8 total sections",
        achievable: "Based on past experience, 2-3 days of focused work is sufficient",
        relevant: "Required for annual review and strategic planning session",
        time_bound: "Due by end of month for board meeting preparation"
      )
    end

    it "allows nil SMART fields" do
      goal = create(:goal, family: family, creator: user)

      expect(goal.specific).to be_nil
      expect(goal.measurable).to be_nil
      expect(goal.achievable).to be_nil
      expect(goal.relevant).to be_nil
      expect(goal.time_bound).to be_nil
    end
  end
end
