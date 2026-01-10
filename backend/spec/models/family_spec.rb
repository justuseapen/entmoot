# frozen_string_literal: true

require "rails_helper"

RSpec.describe Family do
  describe "validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:timezone) }
  end

  describe "associations" do
    it { is_expected.to have_many(:family_memberships).dependent(:destroy) }
    it { is_expected.to have_many(:members).through(:family_memberships).source(:user) }
    it { is_expected.to have_many(:invitations).dependent(:destroy) }
    it { is_expected.to have_many(:pets).dependent(:destroy) }
  end

  describe "#admin_members" do
    let(:family) { create(:family) }
    let(:admin_user) { create(:user) }
    let(:adult_user) { create(:user) }

    before do
      create(:family_membership, :admin, family: family, user: admin_user)
      create(:family_membership, :adult, family: family, user: adult_user)
    end

    it "returns only admin members" do
      expect(family.admin_members).to include(admin_user)
      expect(family.admin_members).not_to include(adult_user)
    end
  end
end
