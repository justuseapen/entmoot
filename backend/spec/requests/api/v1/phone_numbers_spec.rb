# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::PhoneNumbers" do
  let(:user) { create(:user) }
  let(:headers) { auth_headers(user) }

  describe "GET /api/v1/users/me/phone_number" do
    context "when user has no phone number" do
      it "returns null phone number" do
        get "/api/v1/users/me/phone_number", headers: headers

        expect(response).to have_http_status(:ok)
        expect(json_response["phone_number"]).to be_nil
        expect(json_response["phone_verified"]).to be false
        expect(json_response["sms_enabled"]).to be false
        expect(json_response["sms_count_today"]).to eq(0)
        expect(json_response["remaining_sms_quota"]).to eq(5)
      end
    end

    context "when user has a phone number" do
      before do
        user.update(phone_number: "+14155551234", phone_verified: true)
      end

      it "returns the phone number and verification status" do
        get "/api/v1/users/me/phone_number", headers: headers

        expect(response).to have_http_status(:ok)
        expect(json_response["phone_number"]).to eq("+14155551234")
        expect(json_response["phone_verified"]).to be true
      end
    end

    context "when user has SMS enabled in notification preferences" do
      before do
        user.update(phone_number: "+14155551234", phone_verified: true)
        create(:notification_preference, user: user, sms: true)
      end

      it "returns sms_enabled as true" do
        get "/api/v1/users/me/phone_number", headers: headers

        expect(response).to have_http_status(:ok)
        expect(json_response["sms_enabled"]).to be true
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        get "/api/v1/users/me/phone_number"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/users/me/phone_number" do
    context "with valid E.164 phone number" do
      let(:params) { { phone_number: { phone_number: "+14155551234" } } }

      it "adds the phone number to the user" do
        post "/api/v1/users/me/phone_number", params: params, headers: headers

        expect(response).to have_http_status(:ok)
        expect(json_response["phone_number"]).to eq("+14155551234")
        expect(user.reload.phone_number).to eq("+14155551234")
      end

      it "auto-verifies in non-production" do
        post "/api/v1/users/me/phone_number", params: params, headers: headers

        expect(json_response["phone_verified"]).to be true
        expect(user.reload.phone_verified).to be true
      end
    end

    context "with invalid phone number format" do
      let(:params) { { phone_number: { phone_number: "555-1234" } } }

      it "returns an error" do
        post "/api/v1/users/me/phone_number", params: params, headers: headers

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["error"]).to include("E.164")
      end
    end

    context "with phone number already in use by another user" do
      let(:params) { { phone_number: { phone_number: "+14155551234" } } }

      before { create(:user, phone_number: "+14155551234") }

      it "returns an error" do
        post "/api/v1/users/me/phone_number", params: params, headers: headers

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["error"]).to include("already in use")
      end
    end

    context "when updating existing phone number" do
      before { user.update(phone_number: "+14155551234", phone_verified: true) }

      let(:params) { { phone_number: { phone_number: "+14155559999" } } }

      it "updates the phone number and resets verification" do
        post "/api/v1/users/me/phone_number", params: params, headers: headers

        expect(response).to have_http_status(:ok)
        expect(user.reload.phone_number).to eq("+14155559999")
      end
    end

    context "when unauthenticated" do
      let(:params) { { phone_number: { phone_number: "+14155551234" } } }

      it "returns unauthorized" do
        post "/api/v1/users/me/phone_number", params: params

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /api/v1/users/me/phone_number" do
    context "when user has a phone number" do
      before { user.update(phone_number: "+14155551234", phone_verified: true) }

      it "removes the phone number" do
        delete "/api/v1/users/me/phone_number", headers: headers

        expect(response).to have_http_status(:no_content)
        expect(user.reload.phone_number).to be_nil
        expect(user.phone_verified).to be false
      end
    end

    context "when user has no phone number" do
      it "returns not found" do
        delete "/api/v1/users/me/phone_number", headers: headers

        expect(response).to have_http_status(:not_found)
        expect(json_response["error"]).to include("No phone number")
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        delete "/api/v1/users/me/phone_number"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/users/me/phone_number/verify" do
    context "when in non-production environment" do
      before { user.update(phone_number: "+14155551234", phone_verified: false) }

      it "auto-verifies the phone number" do
        post "/api/v1/users/me/phone_number/verify", headers: headers

        expect(response).to have_http_status(:ok)
        expect(json_response["phone_verified"]).to be true
        expect(user.reload.phone_verified).to be true
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        post "/api/v1/users/me/phone_number/verify"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
