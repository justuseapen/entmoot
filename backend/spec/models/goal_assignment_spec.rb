# frozen_string_literal: true

require "rails_helper"

RSpec.describe GoalAssignment do
  describe "associations" do
    it { is_expected.to belong_to(:goal) }
    it { is_expected.to belong_to(:user) }
  end

  describe "validations" do
    describe "uniqueness of goal_id within user" do
      let(:family) { create(:family) }
      let(:user) { create(:user) }
      let(:goal) { create(:goal, family: family, creator: user) }

      before do
        create(:family_membership, family: family, user: user, role: :admin)
        create(:goal_assignment, goal: goal, user: user)
      end

      it "does not allow duplicate assignments" do
        duplicate = build(:goal_assignment, goal: goal, user: user)
        expect(duplicate).not_to be_valid
        expect(duplicate.errors[:goal_id]).to include("user is already assigned to this goal")
      end

      it "allows the same user to be assigned to different goals" do
        other_goal = create(:goal, family: family, creator: user)
        assignment = build(:goal_assignment, goal: other_goal, user: user)
        expect(assignment).to be_valid
      end
    end

    describe "user must be family member" do
      let(:family) { create(:family) }
      let(:creator) { create(:user) }
      let(:goal) { create(:goal, family: family, creator: creator) }
      let(:non_member) { create(:user) }

      before do
        create(:family_membership, family: family, user: creator, role: :admin)
      end

      it "does not allow assignment of non-family members" do
        assignment = build(:goal_assignment, goal: goal, user: non_member)
        expect(assignment).not_to be_valid
        expect(assignment.errors[:user]).to include("must be a member of the goal's family")
      end

      it "allows assignment of family members" do
        member = create(:user)
        create(:family_membership, family: family, user: member, role: :adult)

        assignment = build(:goal_assignment, goal: goal, user: member)
        expect(assignment).to be_valid
      end
    end
  end
end
