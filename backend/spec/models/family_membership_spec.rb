# frozen_string_literal: true

require "rails_helper"

RSpec.describe FamilyMembership do
  describe "validations" do
    subject(:membership) { build(:family_membership) }

    it "validates uniqueness of family_id scoped to user" do
      expect(membership).to validate_uniqueness_of(:family_id)
        .scoped_to(:user_id)
        .with_message("user is already a member")
    end
  end

  describe "single family enforcement" do
    let(:user) { create(:user) }
    let(:family1) { create(:family) }
    let(:family2) { create(:family) }

    it "allows user to join their first family" do
      membership = build(:family_membership, user: user, family: family1)
      expect(membership).to be_valid
    end

    it "prevents user from joining a second family" do
      create(:family_membership, user: user, family: family1)
      membership = build(:family_membership, user: user, family: family2)

      expect(membership).not_to be_valid
      expect(membership.errors[:user]).to include("already belongs to a family")
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:family) }
    it { is_expected.to belong_to(:user) }
  end

  describe "roles" do
    it "defines all expected roles" do
      expect(described_class.roles.keys).to contain_exactly("observer", "child", "teen", "adult", "admin")
    end

    it "defaults to observer role" do
      membership = described_class.new
      expect(membership.role).to eq("observer")
    end
  end

  describe "#can_manage_goals?" do
    it "returns true for admin" do
      membership = build(:family_membership, :admin)
      expect(membership.can_manage_goals?).to be true
    end

    it "returns true for adult" do
      membership = build(:family_membership, :adult)
      expect(membership.can_manage_goals?).to be true
    end

    it "returns false for teen" do
      membership = build(:family_membership, :teen)
      expect(membership.can_manage_goals?).to be false
    end

    it "returns false for child" do
      membership = build(:family_membership, :child)
      expect(membership.can_manage_goals?).to be false
    end

    it "returns false for observer" do
      membership = build(:family_membership, :observer)
      expect(membership.can_manage_goals?).to be false
    end
  end

  describe "#can_invite?" do
    it "returns true for admin" do
      membership = build(:family_membership, :admin)
      expect(membership.can_invite?).to be true
    end

    it "returns true for adult" do
      membership = build(:family_membership, :adult)
      expect(membership.can_invite?).to be true
    end

    it "returns false for teen" do
      membership = build(:family_membership, :teen)
      expect(membership.can_invite?).to be false
    end
  end

  describe "#can_manage_family?" do
    it "returns true for admin" do
      membership = build(:family_membership, :admin)
      expect(membership.can_manage_family?).to be true
    end

    it "returns false for adult" do
      membership = build(:family_membership, :adult)
      expect(membership.can_manage_family?).to be false
    end
  end

  describe ".for_user" do
    let(:user) { create(:user) }
    let(:other_user) { create(:user) }
    let(:family) { create(:family) }

    before do
      create(:family_membership, family: family, user: user)
      create(:family_membership, family: family, user: other_user)
    end

    it "returns only memberships for the specified user" do
      memberships = described_class.for_user(user)
      expect(memberships.count).to eq(1)
      expect(memberships.first.user).to eq(user)
    end
  end
end
