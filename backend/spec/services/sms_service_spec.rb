# frozen_string_literal: true

require "rails_helper"

RSpec.describe SmsService do
  let(:service) { described_class.new }

  describe ".valid_phone_number?" do
    it "returns true for valid E.164 numbers" do
      expect(described_class.valid_phone_number?("+14155551234")).to be true
      expect(described_class.valid_phone_number?("+442071234567")).to be true
      expect(described_class.valid_phone_number?("+819012345678")).to be true
    end

    it "returns false for invalid numbers" do
      expect(described_class.valid_phone_number?("555-1234")).to be false
      expect(described_class.valid_phone_number?("(415) 555-1234")).to be false
      expect(described_class.valid_phone_number?("+0123456789")).to be false # starts with 0
      expect(described_class.valid_phone_number?("14155551234")).to be false # missing +
      expect(described_class.valid_phone_number?("")).to be false
      expect(described_class.valid_phone_number?(nil)).to be false
    end
  end

  describe "#send_message" do
    context "with valid phone number" do
      it "returns success in development" do
        result = service.send_message(to: "+14155551234", body: "Test message")

        expect(result[:success]).to be true
        expect(result[:message_sid]).to be_present
      end

      it "logs the message in development" do
        allow(Rails.logger).to receive(:info)

        service.send_message(to: "+14155551234", body: "Test message")

        expect(Rails.logger).to have_received(:info).with(/Would send SMS to \+14155551234/)
      end
    end

    context "with invalid phone number" do
      it "returns error for blank number" do
        result = service.send_message(to: "", body: "Test message")

        expect(result[:success]).to be false
        expect(result[:error]).to include("required")
      end

      it "returns error for invalid format" do
        result = service.send_message(to: "555-1234", body: "Test message")

        expect(result[:success]).to be false
        expect(result[:error]).to include("E.164")
      end
    end

    context "with rate limiting" do
      let(:user) { create(:user) }

      # Use memory store for rate limiting tests
      around do |example|
        original_cache = Rails.cache
        Rails.cache = ActiveSupport::Cache::MemoryStore.new
        example.run
        Rails.cache = original_cache
      end

      it "allows sends within rate limit" do
        result = service.send_message(to: "+14155551234", body: "Test", user: user)

        expect(result[:success]).to be true
      end

      it "blocks sends when rate limit exceeded" do
        # Simulate hitting rate limit
        5.times { service.send_message(to: "+14155551234", body: "Test", user: user) }

        result = service.send_message(to: "+14155551234", body: "One more", user: user)

        expect(result[:success]).to be false
        expect(result[:error]).to include("rate limit")
      end

      it "tracks SMS count for user" do
        expect(service.sms_count_today(user)).to eq(0)

        service.send_message(to: "+14155551234", body: "Test 1", user: user)
        expect(service.sms_count_today(user)).to eq(1)

        service.send_message(to: "+14155551234", body: "Test 2", user: user)
        expect(service.sms_count_today(user)).to eq(2)
      end

      it "reports remaining quota" do
        expect(service.remaining_sms_quota(user)).to eq(5)

        service.send_message(to: "+14155551234", body: "Test", user: user)
        expect(service.remaining_sms_quota(user)).to eq(4)
      end
    end
  end

  describe "#send_to_user" do
    let(:user) { create(:user, phone_number: "+14155551234", phone_verified: true) }

    context "when user has verified phone and SMS enabled" do
      before { create(:notification_preference, user: user, sms: true) }

      it "sends the message" do
        result = service.send_to_user(user: user, body: "Hello!")

        expect(result[:success]).to be true
      end
    end

    context "when user has no phone number" do
      let(:user) { create(:user, phone_number: nil) }

      it "returns error" do
        result = service.send_to_user(user: user, body: "Hello!")

        expect(result[:success]).to be false
        expect(result[:error]).to include("no verified phone")
      end
    end

    context "when phone is not verified" do
      let(:user) { create(:user, phone_number: "+14155551234", phone_verified: false) }

      it "returns error" do
        result = service.send_to_user(user: user, body: "Hello!")

        expect(result[:success]).to be false
        expect(result[:error]).to include("no verified phone")
      end
    end

    context "when user has opted out of SMS" do
      before { create(:notification_preference, user: user, sms: false) }

      it "returns error" do
        result = service.send_to_user(user: user, body: "Hello!")

        expect(result[:success]).to be false
        expect(result[:error]).to include("opted out")
      end
    end

    context "when user has no notification preferences" do
      it "sends the message (defaults to not opted out)" do
        result = service.send_to_user(user: user, body: "Hello!")

        expect(result[:success]).to be true
      end
    end
  end

  describe "#sms_count_today" do
    let(:user) { create(:user) }

    it "returns 0 for new user" do
      expect(service.sms_count_today(user)).to eq(0)
    end

    it "returns 0 for nil user" do
      expect(service.sms_count_today(nil)).to eq(0)
    end
  end

  describe "#remaining_sms_quota" do
    let(:user) { create(:user) }

    it "returns max quota for new user" do
      expect(service.remaining_sms_quota(user)).to eq(5)
    end
  end
end
