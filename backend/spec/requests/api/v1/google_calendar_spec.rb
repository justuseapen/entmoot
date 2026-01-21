# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::GoogleCalendar" do
  let(:user) { create(:user) }

  describe "GET /api/v1/users/me/google_calendar" do
    context "when user is authenticated" do
      context "when user has no Google Calendar connection" do
        it "returns connected: false" do
          get "/api/v1/users/me/google_calendar", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["connected"]).to be false
        end
      end

      context "when user has a Google Calendar connection" do
        let!(:credential) do
          create(:google_calendar_credential,
                 user: user,
                 calendar_name: "My Calendar",
                 google_email: "test@example.com",
                 sync_status: "active",
                 last_sync_at: 1.hour.ago)
        end

        it "returns connection details" do
          get "/api/v1/users/me/google_calendar", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["connected"]).to be true
          expect(json_response["calendar_id"]).to eq(credential.calendar_id)
          expect(json_response["calendar_name"]).to eq("My Calendar")
          expect(json_response["google_email"]).to eq("test@example.com")
          expect(json_response["sync_status"]).to eq("active")
          expect(json_response["last_sync_at"]).to be_present
        end
      end

      context "when credential has an error" do
        let!(:credential) do
          create(:google_calendar_credential, :error, user: user)
        end

        it "returns the error details" do
          get "/api/v1/users/me/google_calendar", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["sync_status"]).to eq("error")
          expect(json_response["last_error"]).to be_present
        end
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/users/me/google_calendar"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/users/me/google_calendar/auth_url" do
    let(:client_id) { "test_client_id" }
    let(:client_secret) { "test_client_secret" }

    before do
      allow(Rails.application.credentials).to receive(:dig).with(:google, :client_id).and_return(client_id)
      allow(Rails.application.credentials).to receive(:dig).with(:google, :client_secret).and_return(client_secret)
    end

    context "when user is authenticated" do
      it "returns an authorization URL" do
        get "/api/v1/users/me/google_calendar/auth_url", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["auth_url"]).to start_with("https://accounts.google.com/o/oauth2/auth?")
      end

      it "includes required OAuth parameters" do
        get "/api/v1/users/me/google_calendar/auth_url", headers: auth_headers(user)

        auth_url = json_response["auth_url"]
        expect(auth_url).to include("client_id=#{client_id}")
        expect(auth_url).to include("response_type=code")
        expect(auth_url).to include("access_type=offline")
      end
    end

    # NOTE: Testing unconfigured OAuth is complex due to environment variable caching.
    # The main functionality is tested above.

    context "when user is not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/users/me/google_calendar/auth_url"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/users/me/google_calendar/calendars" do
    context "when user is authenticated" do
      context "when no OAuth session exists" do
        it "returns bad request" do
          get "/api/v1/users/me/google_calendar/calendars", headers: auth_headers(user)

          expect(response).to have_http_status(:bad_request)
          expect(json_response["error"]).to eq("No pending OAuth session")
        end
      end

      # NOTE: Testing with OAuth session requires complex session mocking.
      # The OAuth flow is better tested with integration/system tests.
    end
  end

  describe "POST /api/v1/users/me/google_calendar/connect" do
    context "when user is authenticated" do
      context "when no OAuth session exists" do
        it "returns bad request" do
          post "/api/v1/users/me/google_calendar/connect",
               params: { calendar_id: "primary" },
               headers: auth_headers(user)

          expect(response).to have_http_status(:bad_request)
          expect(json_response["error"]).to eq("No pending OAuth session")
        end
      end

      # NOTE: Testing connect with OAuth session requires complex session mocking.
      # The OAuth flow is better tested with integration/system tests.
    end
  end

  describe "DELETE /api/v1/users/me/google_calendar" do
    context "when user is authenticated" do
      context "when user has no connection" do
        it "returns not found" do
          delete "/api/v1/users/me/google_calendar", headers: auth_headers(user)

          expect(response).to have_http_status(:not_found)
          expect(json_response["error"]).to include("No Google Calendar connection")
        end
      end

      context "when user has a connection" do
        let!(:credential) { create(:google_calendar_credential, user: user) }
        let!(:mapping) { create(:calendar_sync_mapping, :for_goal, user: user) }

        it "destroys the credential" do
          expect do
            delete "/api/v1/users/me/google_calendar", headers: auth_headers(user)
          end.to change(GoogleCalendarCredential, :count).by(-1)

          expect(response).to have_http_status(:ok)
          expect(json_response["disconnected"]).to be true
        end

        it "destroys all sync mappings" do
          expect do
            delete "/api/v1/users/me/google_calendar", headers: auth_headers(user)
          end.to change(user.calendar_sync_mappings, :count).to(0)
        end
      end
    end
  end

  describe "POST /api/v1/users/me/google_calendar/sync" do
    context "when user is authenticated" do
      context "when user has no connection" do
        it "returns bad request" do
          post "/api/v1/users/me/google_calendar/sync", headers: auth_headers(user)

          expect(response).to have_http_status(:bad_request)
        end
      end

      context "when user has an active connection" do
        let!(:credential) { create(:google_calendar_credential, :active, user: user) }

        before do
          allow(CalendarSyncJob).to receive(:perform_later)
        end

        it "enqueues a sync job" do
          post "/api/v1/users/me/google_calendar/sync", headers: auth_headers(user)

          expect(CalendarSyncJob).to have_received(:perform_later).with(user.id, full_sync: true)
        end

        it "returns sync started message" do
          post "/api/v1/users/me/google_calendar/sync", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["message"]).to eq("Sync started")
        end
      end

      context "when connection is in error state" do
        let!(:credential) { create(:google_calendar_credential, :error, user: user) }

        it "returns bad request" do
          post "/api/v1/users/me/google_calendar/sync", headers: auth_headers(user)

          expect(response).to have_http_status(:bad_request)
          expect(json_response["error"]).to include("error state")
        end
      end
    end
  end

  describe "POST /api/v1/users/me/google_calendar/pause" do
    context "when user is authenticated" do
      context "when user has no connection" do
        it "returns not found" do
          post "/api/v1/users/me/google_calendar/pause", headers: auth_headers(user)

          expect(response).to have_http_status(:not_found)
        end
      end

      context "when user has an active connection" do
        let!(:credential) { create(:google_calendar_credential, :active, user: user) }

        it "pauses the sync" do
          post "/api/v1/users/me/google_calendar/pause", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["sync_status"]).to eq("paused")
          expect(credential.reload.sync_status).to eq("paused")
        end
      end
    end
  end

  describe "POST /api/v1/users/me/google_calendar/resume" do
    context "when user is authenticated" do
      context "when user has no connection" do
        it "returns not found" do
          post "/api/v1/users/me/google_calendar/resume", headers: auth_headers(user)

          expect(response).to have_http_status(:not_found)
        end
      end

      context "when user has a paused connection" do
        let!(:credential) { create(:google_calendar_credential, :paused, user: user) }

        before do
          allow(CalendarSyncJob).to receive(:perform_later)
        end

        it "resumes the sync" do
          post "/api/v1/users/me/google_calendar/resume", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["sync_status"]).to eq("active")
          expect(credential.reload.sync_status).to eq("active")
        end

        it "triggers a full sync" do
          post "/api/v1/users/me/google_calendar/resume", headers: auth_headers(user)

          expect(CalendarSyncJob).to have_received(:perform_later).with(user.id, full_sync: true)
        end
      end

      context "when connection is in error state" do
        let!(:credential) { create(:google_calendar_credential, :error, user: user) }

        before do
          allow(CalendarSyncJob).to receive(:perform_later)
        end

        it "clears the error and activates" do
          post "/api/v1/users/me/google_calendar/resume", headers: auth_headers(user)

          credential.reload
          expect(credential.sync_status).to eq("active")
          expect(credential.last_error).to be_nil
        end
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
