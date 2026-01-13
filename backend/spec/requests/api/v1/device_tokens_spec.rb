# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::DeviceTokens" do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }

  describe "POST /api/v1/device_tokens" do
    let(:valid_params) do
      {
        device_token: {
          token: "fcm_token_12345",
          platform: "ios",
          device_name: "iPhone 15 Pro"
        }
      }
    end

    context "when user is authenticated" do
      it "creates a new device token" do
        expect do
          post "/api/v1/device_tokens", params: valid_params, headers: auth_headers(user)
        end.to change(DeviceToken, :count).by(1)

        expect(response).to have_http_status(:created)
      end

      it "returns the created device token" do
        post "/api/v1/device_tokens", params: valid_params, headers: auth_headers(user)

        expect(json_response["device_token"]).to include(
          "token" => "fcm_token_12345",
          "platform" => "ios",
          "device_name" => "iPhone 15 Pro"
        )
      end

      it "associates the token with the current user" do
        post "/api/v1/device_tokens", params: valid_params, headers: auth_headers(user)

        expect(DeviceToken.last.user).to eq(user)
      end

      context "when token already exists for this user" do
        before do
          create(:device_token, user: user, token: "fcm_token_12345", platform: "android")
        end

        it "updates the existing token" do
          expect do
            post "/api/v1/device_tokens", params: valid_params, headers: auth_headers(user)
          end.not_to change(DeviceToken, :count)

          expect(response).to have_http_status(:ok)
        end

        it "updates platform and device_name" do
          post "/api/v1/device_tokens", params: valid_params, headers: auth_headers(user)

          token = DeviceToken.find_by(token: "fcm_token_12345")
          expect(token.platform).to eq("ios")
          expect(token.device_name).to eq("iPhone 15 Pro")
        end

        it "updates last_used_at" do
          post "/api/v1/device_tokens", params: valid_params, headers: auth_headers(user)

          token = DeviceToken.find_by(token: "fcm_token_12345")
          expect(token.last_used_at).to be_within(1.second).of(Time.current)
        end
      end

      context "with invalid params" do
        it "returns error when token is missing" do
          post "/api/v1/device_tokens",
               params: { device_token: { platform: "ios" } },
               headers: auth_headers(user)

          expect(response).to have_http_status(:unprocessable_content)
          expect(json_response["errors"]).to include("Token can't be blank")
        end

        it "returns error when platform is missing" do
          post "/api/v1/device_tokens",
               params: { device_token: { token: "abc123" } },
               headers: auth_headers(user)

          expect(response).to have_http_status(:unprocessable_content)
          expect(json_response["errors"]).to include("Platform can't be blank")
        end

        it "returns error when platform is invalid" do
          post "/api/v1/device_tokens",
               params: { device_token: { token: "abc123", platform: "invalid" } },
               headers: auth_headers(user)

          expect(response).to have_http_status(:unprocessable_content)
          expect(json_response["errors"]).to include("Platform is not included in the list")
        end
      end

      context "with different platforms" do
        %w[ios android web].each do |platform|
          it "accepts #{platform} as a valid platform" do
            post "/api/v1/device_tokens",
                 params: { device_token: { token: "token_#{platform}", platform: platform } },
                 headers: auth_headers(user)

            expect(response).to have_http_status(:created)
            expect(json_response["device_token"]["platform"]).to eq(platform)
          end
        end
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/device_tokens", params: valid_params

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /api/v1/device_tokens/:id" do
    context "when user is authenticated" do
      let!(:device_token) { create(:device_token, user: user) }

      it "deletes the device token" do
        expect do
          delete "/api/v1/device_tokens/#{device_token.id}", headers: auth_headers(user)
        end.to change(DeviceToken, :count).by(-1)

        expect(response).to have_http_status(:no_content)
      end

      context "when device token belongs to another user" do
        let!(:other_token) { create(:device_token, user: other_user) }

        it "returns not found" do
          delete "/api/v1/device_tokens/#{other_token.id}", headers: auth_headers(user)

          expect(response).to have_http_status(:not_found)
        end

        it "does not delete the token" do
          expect do
            delete "/api/v1/device_tokens/#{other_token.id}", headers: auth_headers(user)
          end.not_to change(DeviceToken, :count)
        end
      end

      context "when device token does not exist" do
        it "returns not found" do
          delete "/api/v1/device_tokens/999999", headers: auth_headers(user)

          expect(response).to have_http_status(:not_found)
        end
      end
    end

    context "when user is not authenticated" do
      let!(:device_token) { create(:device_token, user: user) }

      it "returns unauthorized" do
        delete "/api/v1/device_tokens/#{device_token.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /api/v1/device_tokens/unregister" do
    context "when user is authenticated" do
      it "deletes the device token by token value" do
        create(:device_token, user: user, token: "token_to_unregister")

        expect do
          delete "/api/v1/device_tokens/unregister",
                 params: { token: "token_to_unregister" },
                 headers: auth_headers(user)
        end.to change(DeviceToken, :count).by(-1)

        expect(response).to have_http_status(:no_content)
      end

      context "when token does not exist" do
        it "returns not found" do
          delete "/api/v1/device_tokens/unregister",
                 params: { token: "nonexistent_token" },
                 headers: auth_headers(user)

          expect(response).to have_http_status(:not_found)
        end
      end

      context "when token belongs to another user" do
        it "returns not found" do
          create(:device_token, user: other_user, token: "other_user_token")

          delete "/api/v1/device_tokens/unregister",
                 params: { token: "other_user_token" },
                 headers: auth_headers(user)

          expect(response).to have_http_status(:not_found)
        end
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized" do
        delete "/api/v1/device_tokens/unregister", params: { token: "some_token" }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
