# frozen_string_literal: true

require "rails_helper"

RSpec.describe PushNotificationService do
  let(:service) { described_class.new }
  let(:user) { create(:user) }

  before do
    allow(Rails.logger).to receive(:info)
    allow(Rails.logger).to receive(:error)
  end

  describe "#send_to_user" do
    context "when user has no device tokens" do
      it "returns zero sent and failed counts" do
        result = service.send_to_user(
          user: user,
          title: "Test Title",
          body: "Test Body"
        )

        expect(result).to eq({ sent: 0, failed: 0 })
      end
    end

    context "when user has active device tokens" do
      let!(:device_token) { create(:device_token, user: user, platform: "ios") }

      it "returns sent count of 1 for successful delivery" do
        result = service.send_to_user(
          user: user,
          title: "Test Title",
          body: "Test Body"
        )

        expect(result[:sent]).to eq(1)
        expect(result[:failed]).to eq(0)
      end

      it "updates last_used_at on successful delivery" do
        expect do
          service.send_to_user(user: user, title: "Test", body: "Body")
        end.to(change { device_token.reload.last_used_at })
      end

      it "logs the notification message" do
        service.send_to_user(user: user, title: "Test", body: "Body")

        expect(Rails.logger).to have_received(:info).with(/Would send message/)
      end
    end

    context "when user has multiple device tokens" do
      before do
        create(:device_token, user: user, platform: "ios")
        create(:device_token, user: user, platform: "android")
        create(:device_token, user: user, platform: "web")
      end

      it "sends to all active tokens" do
        result = service.send_to_user(
          user: user,
          title: "Test Title",
          body: "Test Body"
        )

        expect(result[:sent]).to eq(3)
      end
    end

    context "when user has stale device tokens" do
      before do
        create(:device_token, :stale, user: user, platform: "ios")
        create(:device_token, :recently_used, user: user, platform: "android")
      end

      it "only sends to active tokens (not stale)" do
        result = service.send_to_user(
          user: user,
          title: "Test Title",
          body: "Test Body"
        )

        expect(result[:sent]).to eq(1)
      end
    end

    context "with data and link parameters" do
      before do
        create(:device_token, user: user)
      end

      it "includes data and link in the message" do
        service.send_to_user(
          user: user,
          title: "Test",
          body: "Body",
          data: { custom_key: "custom_value" },
          link: "/dashboard"
        )

        expect(Rails.logger).to have_received(:info) do |message|
          expect(message).to include("link")
          expect(message).to include("custom_key")
        end
      end
    end
  end

  describe "#send_to_token" do
    context "when running in development" do
      it "logs the message and returns success" do
        result = service.send_to_token(
          token: "test_token",
          title: "Test Title",
          body: "Test Body",
          platform: "android"
        )

        expect(Rails.logger).to have_received(:info).with(/Would send message/)
        expect(result[:success]).to be true
        expect(result[:message_id]).to start_with("test_")
      end
    end

    context "with ios platform" do
      it "includes apns configuration in the message" do
        service.send_to_token(
          token: "test_token",
          title: "Test",
          body: "Body",
          platform: "ios"
        )

        expect(Rails.logger).to have_received(:info) do |message|
          parsed = JSON.parse(message.sub("PushNotificationService: Would send message: ", ""))
          expect(parsed["message"]["apns"]).to be_present
          expect(parsed["message"]["apns"]["payload"]["aps"]["sound"]).to eq("default")
        end
      end
    end

    context "with android platform" do
      it "includes android configuration in the message" do
        service.send_to_token(
          token: "test_token",
          title: "Test",
          body: "Body",
          platform: "android"
        )

        expect(Rails.logger).to have_received(:info) do |message|
          parsed = JSON.parse(message.sub("PushNotificationService: Would send message: ", ""))
          expect(parsed["message"]["android"]).to be_present
          expect(parsed["message"]["android"]["priority"]).to eq("high")
        end
      end
    end

    context "with data values that are not strings" do
      it "converts all data values to strings" do
        service.send_to_token(
          token: "test_token",
          title: "Test",
          body: "Body",
          data: { count: 42, enabled: true }
        )

        expect(Rails.logger).to have_received(:info) do |message|
          parsed = JSON.parse(message.sub("PushNotificationService: Would send message: ", ""))
          data = parsed["message"]["data"]
          expect(data["count"]).to eq("42")
          expect(data["enabled"]).to eq("true")
        end
      end
    end
  end

  describe "#send_to_users" do
    let(:sender) { create(:user) }
    let(:recipient) { create(:user) }
    let(:silent_user) { create(:user) }

    before do
      create(:device_token, user: sender)
      create(:device_token, user: recipient)
      create(:device_token, user: recipient) # recipient has 2 devices
      # silent_user has no device tokens
    end

    it "sends to all users with device tokens" do
      result = service.send_to_users(
        users: User.where(id: [sender.id, recipient.id, silent_user.id]),
        title: "Batch Test",
        body: "Batch Body"
      )

      expect(result[:total_sent]).to eq(3)
      expect(result[:total_failed]).to eq(0)
      expect(result[:user_results].count).to eq(3)
    end

    it "returns results for each user" do
      result = service.send_to_users(
        users: User.where(id: [sender.id, recipient.id]),
        title: "Batch Test",
        body: "Batch Body"
      )

      sender_result = result[:user_results].find { |r| r[:user_id] == sender.id }
      recipient_result = result[:user_results].find { |r| r[:user_id] == recipient.id }

      expect(sender_result[:sent]).to eq(1)
      expect(recipient_result[:sent]).to eq(2)
    end
  end

  describe "invalid token cleanup" do
    context "when tokens become invalid" do
      before do
        create(:device_token, user: user)
      end

      # NOTE: We can't easily test the actual cleanup in non-production
      # because the service returns success. This would be tested in integration
      # tests with actual FCM responses.

      it "includes invalid_tokens array in results" do
        result = service.send_to_user(
          user: user,
          title: "Test",
          body: "Body"
        )

        expect(result).to have_key(:invalid_tokens)
      end
    end
  end

  describe "message building" do
    it "builds message with correct structure" do
      service.send_to_token(
        token: "test_token",
        title: "Test Title",
        body: "Test Body"
      )

      expect(Rails.logger).to have_received(:info) do |message|
        parsed = JSON.parse(message.sub("PushNotificationService: Would send message: ", ""))

        expect(parsed["message"]).to include(
          "token" => "test_token",
          "notification" => {
            "title" => "Test Title",
            "body" => "Test Body"
          }
        )
      end
    end
  end
end
