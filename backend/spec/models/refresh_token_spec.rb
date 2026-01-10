# frozen_string_literal: true

require "rails_helper"

RSpec.describe RefreshToken do
  describe "validations" do
    it { is_expected.to validate_presence_of(:expires_at) }

    it "validates uniqueness of token" do
      user = create(:user)
      existing_token = create(:refresh_token, user: user, token: "unique_token_123")
      duplicate_token = build(:refresh_token, user: user, token: "unique_token_123")

      expect(duplicate_token).not_to be_valid
      expect(duplicate_token.errors[:token]).to include("has already been taken")
      expect(existing_token).to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:user) }
  end

  describe "#expired?" do
    it "returns true when expires_at is in the past" do
      token = build(:refresh_token, expires_at: 1.day.ago)
      expect(token.expired?).to be true
    end

    it "returns false when expires_at is in the future" do
      token = build(:refresh_token, expires_at: 1.day.from_now)
      expect(token.expired?).to be false
    end
  end

  describe "#revoked?" do
    it "returns true when revoked_at is present" do
      token = build(:refresh_token, revoked_at: Time.current)
      expect(token.revoked?).to be true
    end

    it "returns false when revoked_at is nil" do
      token = build(:refresh_token, revoked_at: nil)
      expect(token.revoked?).to be false
    end
  end

  describe "#active?" do
    it "returns true when not expired and not revoked" do
      token = build(:refresh_token, expires_at: 1.day.from_now, revoked_at: nil)
      expect(token.active?).to be true
    end

    it "returns false when expired" do
      token = build(:refresh_token, expires_at: 1.day.ago, revoked_at: nil)
      expect(token.active?).to be false
    end

    it "returns false when revoked" do
      token = build(:refresh_token, expires_at: 1.day.from_now, revoked_at: Time.current)
      expect(token.active?).to be false
    end
  end

  describe "#revoke!" do
    it "sets revoked_at to current time" do
      token = create(:refresh_token)
      expect(token.revoked_at).to be_nil

      token.revoke!
      token.reload

      expect(token.revoked_at).to be_present
      expect(token.revoked?).to be true
    end
  end

  describe ".active scope" do
    it "returns only active tokens" do
      user = create(:user)
      active_token = create(:refresh_token, user: user)
      create(:refresh_token, :expired, user: user)
      create(:refresh_token, :revoked, user: user)

      expect(described_class.active).to contain_exactly(active_token)
    end
  end

  describe "token generation" do
    it "generates a token before validation on create" do
      token = build(:refresh_token, token: nil)
      token.valid?
      expect(token.token).to be_present
    end

    it "does not overwrite an existing token" do
      existing_token = "existing_token_123"
      token = build(:refresh_token, token: existing_token)
      token.valid?
      expect(token.token).to eq(existing_token)
    end
  end
end
