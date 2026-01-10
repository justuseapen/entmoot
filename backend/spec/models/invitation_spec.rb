# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invitation do
  describe "validations" do
    subject { create(:invitation) }

    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:token) }

    it "auto-generates expires_at so presence validation is effectively satisfied" do
      invitation = build(:invitation)
      invitation.expires_at = nil
      invitation.valid?
      expect(invitation.expires_at).to be_present
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:family) }
    it { is_expected.to belong_to(:inviter).class_name("User") }
  end

  describe "email format validation" do
    it "accepts valid email" do
      invitation = build(:invitation, email: "test@example.com")
      expect(invitation).to be_valid
    end

    it "rejects invalid email" do
      invitation = build(:invitation, email: "invalid-email")
      expect(invitation).not_to be_valid
    end
  end

  describe "auto-generated attributes" do
    it "generates a token on create" do
      invitation = create(:invitation)
      expect(invitation.token).to be_present
      expect(invitation.token.length).to be >= 32
    end

    it "sets expires_at to 7 days from now by default" do
      freeze_time do
        invitation = create(:invitation)
        expect(invitation.expires_at).to be_within(1.second).of(7.days.from_now)
      end
    end
  end

  describe "scopes" do
    describe ".pending" do
      it "returns only pending invitations" do
        pending_invitation = create(:invitation)
        create(:invitation, :expired)
        create(:invitation, :accepted)

        expect(described_class.pending).to contain_exactly(pending_invitation)
      end
    end

    describe ".expired" do
      it "returns only expired invitations" do
        create(:invitation)
        expired_invitation = create(:invitation, :expired)
        create(:invitation, :accepted)

        expect(described_class.expired).to contain_exactly(expired_invitation)
      end
    end
  end

  describe "#pending?" do
    it "returns true for a pending invitation" do
      invitation = build(:invitation)
      expect(invitation.pending?).to be true
    end

    it "returns false for an expired invitation" do
      invitation = build(:invitation, :expired)
      expect(invitation.pending?).to be false
    end

    it "returns false for an accepted invitation" do
      invitation = build(:invitation, :accepted)
      expect(invitation.pending?).to be false
    end
  end

  describe "#expired?" do
    it "returns true for an expired invitation" do
      invitation = build(:invitation, :expired)
      expect(invitation.expired?).to be true
    end

    it "returns false for a pending invitation" do
      invitation = build(:invitation)
      expect(invitation.expired?).to be false
    end
  end

  describe "#accepted?" do
    it "returns true for an accepted invitation" do
      invitation = build(:invitation, :accepted)
      expect(invitation.accepted?).to be true
    end

    it "returns false for a pending invitation" do
      invitation = build(:invitation)
      expect(invitation.accepted?).to be false
    end
  end

  describe "#accept!" do
    let(:invitation) { create(:invitation, role: :adult) }
    let(:user) { create(:user) }

    it "returns true on success" do
      expect(invitation.accept!(user)).to be true
    end

    it "creates a family membership" do
      expect { invitation.accept!(user) }.to change(FamilyMembership, :count).by(1)
    end

    it "sets accepted_at on the invitation" do
      invitation.accept!(user)
      expect(invitation.reload.accepted_at).to be_present
    end

    it "creates membership with correct attributes" do
      invitation.accept!(user)
      membership = FamilyMembership.last

      expect(membership).to have_attributes(user: user, family: invitation.family, role: "adult")
    end

    it "returns false for expired invitation" do
      expired = create(:invitation, :expired)
      expect(expired.accept!(user)).to be false
    end

    it "returns false for already accepted invitation" do
      accepted = create(:invitation, :accepted)
      expect(accepted.accept!(user)).to be false
    end
  end
end
