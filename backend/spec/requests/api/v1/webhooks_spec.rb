# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Webhooks" do
  describe "POST /api/v1/webhooks/twilio" do
    let!(:user) { create(:user, phone_number: "+14155551234", phone_verified: true) }
    let!(:notification_preference) { create(:notification_preference, user: user, sms: true) }

    context "when receiving STOP command" do
      let(:params) { { From: "+14155551234", Body: "STOP" } }

      it "disables SMS for the user" do
        post "/api/v1/webhooks/twilio", params: params

        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include("application/xml")
        expect(notification_preference.reload.sms).to be false
      end

      %w[STOP UNSUBSCRIBE CANCEL END QUIT].each do |command|
        it "handles #{command} command (case insensitive)" do
          post "/api/v1/webhooks/twilio", params: { From: "+14155551234", Body: command.downcase }

          expect(response).to have_http_status(:ok)
          expect(notification_preference.reload.sms).to be false
        end
      end
    end

    context "when receiving START command" do
      let!(:notification_preference) { create(:notification_preference, user: user, sms: false) }

      %w[START YES UNSTOP].each do |command|
        it "handles #{command} command to opt back in" do
          post "/api/v1/webhooks/twilio", params: { From: "+14155551234", Body: command }

          expect(response).to have_http_status(:ok)
          expect(notification_preference.reload.sms).to be true
        end
      end
    end

    context "when receiving unknown command" do
      let(:params) { { From: "+14155551234", Body: "Hello!" } }

      it "returns empty TwiML response without changing preferences" do
        expect do
          post "/api/v1/webhooks/twilio", params: params
        end.not_to(change { notification_preference.reload.sms })

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("<Response></Response>")
      end
    end

    context "when phone number is not found" do
      let(:params) { { From: "+19999999999", Body: "STOP" } }

      it "returns empty TwiML response" do
        post "/api/v1/webhooks/twilio", params: params

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("<Response></Response>")
      end
    end

    context "when user has no notification preferences" do
      before { create(:user, phone_number: "+19998887777", phone_verified: true) }

      it "handles gracefully" do
        post "/api/v1/webhooks/twilio", params: { From: "+19998887777", Body: "STOP" }

        expect(response).to have_http_status(:ok)
      end
    end
  end
end
