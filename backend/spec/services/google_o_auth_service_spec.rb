# frozen_string_literal: true

require "rails_helper"

RSpec.describe GoogleOAuthService do
  let(:client_id) { "test_client_id" }
  let(:client_secret) { "test_client_secret" }

  # We need to stub the credentials method at the class level since they're cached
  around do |example|
    # Save original environment values and set test values
    original_client_id = ENV.fetch("GOOGLE_CLIENT_ID", nil)
    original_client_secret = ENV.fetch("GOOGLE_CLIENT_SECRET", nil)

    ENV["GOOGLE_CLIENT_ID"] = client_id
    ENV["GOOGLE_CLIENT_SECRET"] = client_secret

    # Clear the cached credentials
    described_class.instance_variable_set(:@credentials, nil)

    example.run

    # Restore original values
    ENV["GOOGLE_CLIENT_ID"] = original_client_id
    ENV["GOOGLE_CLIENT_SECRET"] = original_client_secret
    described_class.instance_variable_set(:@credentials, nil)
  end

  describe ".authorization_url" do
    let(:state) { SecureRandom.urlsafe_base64(32) }
    let(:redirect_uri) { "http://localhost:3000/api/v1/users/me/google_calendar/callback" }

    it "returns a properly formatted Google OAuth URL" do
      url = described_class.authorization_url(state: state, redirect_uri: redirect_uri)

      expect(url).to start_with("https://accounts.google.com/o/oauth2/auth?")
      expect(url).to include("client_id=#{client_id}")
      expect(url).to include("redirect_uri=#{CGI.escape(redirect_uri)}")
      expect(url).to include("response_type=code")
      expect(url).to include("scope=#{CGI.escape("https://www.googleapis.com/auth/calendar")}")
      expect(url).to include("access_type=offline")
      expect(url).to include("prompt=consent")
      expect(url).to include("state=#{state}")
    end

    context "when client_id is not configured" do
      it "raises ConfigurationError" do
        # Temporarily clear client_id
        original = ENV.fetch("GOOGLE_CLIENT_ID", nil)
        ENV["GOOGLE_CLIENT_ID"] = nil
        described_class.instance_variable_set(:@credentials, nil)

        expect do
          described_class.authorization_url(state: state, redirect_uri: redirect_uri)
        end.to raise_error(GoogleOAuthService::ConfigurationError, "Google OAuth client_id is not configured")
      ensure
        ENV["GOOGLE_CLIENT_ID"] = original
        described_class.instance_variable_set(:@credentials, nil)
      end
    end

    context "when client_secret is not configured" do
      it "raises ConfigurationError" do
        # Temporarily clear client_secret
        original = ENV.fetch("GOOGLE_CLIENT_SECRET", nil)
        ENV["GOOGLE_CLIENT_SECRET"] = nil
        described_class.instance_variable_set(:@credentials, nil)

        expect do
          described_class.authorization_url(state: state, redirect_uri: redirect_uri)
        end.to raise_error(GoogleOAuthService::ConfigurationError, "Google OAuth client_secret is not configured")
      ensure
        ENV["GOOGLE_CLIENT_SECRET"] = original
        described_class.instance_variable_set(:@credentials, nil)
      end
    end
  end

  describe ".exchange_code" do
    let(:code) { "auth_code_123" }
    let(:redirect_uri) { "http://localhost:3000/api/v1/users/me/google_calendar/callback" }
    let(:success_response_body) do
      {
        "access_token" => "access_token_123",
        "refresh_token" => "refresh_token_456",
        "expires_in" => 3600,
        "token_type" => "Bearer",
        "scope" => "https://www.googleapis.com/auth/calendar"
      }
    end

    context "when token exchange is successful" do
      let(:mock_response) do
        instance_double(Faraday::Response, success?: true, body: success_response_body.to_json)
      end

      before do
        allow(Faraday).to receive(:post).and_return(mock_response)
      end

      it "returns token data" do
        result = described_class.exchange_code(code: code, redirect_uri: redirect_uri)

        expect(result[:access_token]).to eq("access_token_123")
        expect(result[:refresh_token]).to eq("refresh_token_456")
        expect(result[:token_type]).to eq("Bearer")
        expect(result[:scope]).to eq("https://www.googleapis.com/auth/calendar")
        expect(result[:expires_at]).to be_within(5.seconds).of(1.hour.from_now)
      end
    end

    context "when token exchange fails" do
      let(:error_response_body) do
        {
          "error" => "invalid_grant",
          "error_description" => "Code has expired or been used"
        }
      end
      let(:mock_response) do
        instance_double(Faraday::Response, success?: false, body: error_response_body.to_json)
      end

      before do
        allow(Faraday).to receive(:post).and_return(mock_response)
      end

      it "raises TokenExchangeError with error description" do
        expect do
          described_class.exchange_code(code: code, redirect_uri: redirect_uri)
        end.to raise_error(GoogleOAuthService::TokenExchangeError, "Code has expired or been used")
      end
    end

    context "when token exchange fails without error_description" do
      let(:error_response_body) { { "error" => "invalid_request" } }
      let(:mock_response) do
        instance_double(Faraday::Response, success?: false, body: error_response_body.to_json)
      end

      before do
        allow(Faraday).to receive(:post).and_return(mock_response)
      end

      it "raises TokenExchangeError with error code" do
        expect do
          described_class.exchange_code(code: code, redirect_uri: redirect_uri)
        end.to raise_error(GoogleOAuthService::TokenExchangeError, "invalid_request")
      end
    end
  end

  describe ".refresh_access_token" do
    let(:refresh_token) { "refresh_token_456" }
    let(:success_response_body) do
      {
        "access_token" => "new_access_token",
        "expires_in" => 3600,
        "token_type" => "Bearer",
        "scope" => "https://www.googleapis.com/auth/calendar"
      }
    end

    context "when token refresh is successful" do
      let(:mock_response) do
        instance_double(Faraday::Response, success?: true, body: success_response_body.to_json)
      end

      before do
        allow(Faraday).to receive(:post).and_return(mock_response)
      end

      it "returns new token data" do
        result = described_class.refresh_access_token(refresh_token: refresh_token)

        expect(result[:access_token]).to eq("new_access_token")
        expect(result[:refresh_token]).to be_nil # Google doesn't always return a new refresh token
        expect(result[:expires_at]).to be_within(5.seconds).of(1.hour.from_now)
      end
    end

    context "when a new refresh token is returned" do
      let(:success_response_with_refresh) do
        success_response_body.merge("refresh_token" => "new_refresh_token")
      end
      let(:mock_response) do
        instance_double(Faraday::Response, success?: true, body: success_response_with_refresh.to_json)
      end

      before do
        allow(Faraday).to receive(:post).and_return(mock_response)
      end

      it "includes the new refresh token" do
        result = described_class.refresh_access_token(refresh_token: refresh_token)

        expect(result[:refresh_token]).to eq("new_refresh_token")
      end
    end

    context "when token refresh fails" do
      let(:error_response_body) do
        {
          "error" => "invalid_grant",
          "error_description" => "Token has been revoked"
        }
      end
      let(:mock_response) do
        instance_double(Faraday::Response, success?: false, body: error_response_body.to_json)
      end

      before do
        allow(Faraday).to receive(:post).and_return(mock_response)
      end

      it "raises TokenExchangeError" do
        expect do
          described_class.refresh_access_token(refresh_token: refresh_token)
        end.to raise_error(GoogleOAuthService::TokenExchangeError, "Token has been revoked")
      end
    end
  end
end
