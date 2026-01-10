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

  describe "#jwt_payload" do
    let(:user) { create(:user) }

    it "returns a hash with user_id" do
      payload = user.jwt_payload
      expect(payload).to eq({ user_id: user.id })
    end
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

    it "uses jwt_authenticatable" do
      expect(described_class.devise_modules).to include(:jwt_authenticatable)
    end
  end
end
