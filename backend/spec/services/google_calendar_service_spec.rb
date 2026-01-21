# frozen_string_literal: true

require "rails_helper"

RSpec.describe GoogleCalendarService do
  let(:user) { create(:user) }
  let(:credential) { create(:google_calendar_credential, user: user) }
  let(:client_id) { "test_client_id" }
  let(:client_secret) { "test_client_secret" }

  before do
    allow(Rails.application.credentials).to receive(:dig).with(:google, :client_id).and_return(client_id)
    allow(Rails.application.credentials).to receive(:dig).with(:google, :client_secret).and_return(client_secret)
  end

  describe "#initialize" do
    it "uses the user's google_calendar_credential by default" do
      credential # ensure credential exists
      service = described_class.new(user)
      expect(service).to be_present
    end

    it "accepts a custom credential" do
      other_credential = create(:google_calendar_credential)
      service = described_class.new(user, credential: other_credential)
      expect(service).to be_present
    end

    it "raises AuthenticationError if user has no credential" do
      expect do
        described_class.new(user)
      end.to raise_error(GoogleCalendarService::AuthenticationError, "User has no Google Calendar credentials")
    end
  end

  describe "#list_calendars" do
    let(:service) { described_class.new(user, credential: credential) }
    let(:mock_api_client) { instance_double(Google::Apis::CalendarV3::CalendarService) }
    let(:calendar_list_response) do
      double("CalendarList", items: [
               double("Calendar",
                      id: "primary",
                      summary: "My Calendar",
                      description: "Primary calendar",
                      primary: true,
                      access_role: "owner"),
               double("Calendar",
                      id: "work@example.com",
                      summary: "Work",
                      description: nil,
                      primary: false,
                      access_role: "owner")
             ])
    end

    before do
      allow(Google::Apis::CalendarV3::CalendarService).to receive(:new).and_return(mock_api_client)
      allow(mock_api_client).to receive(:authorization=)
      allow(mock_api_client).to receive(:list_calendar_lists).and_return(calendar_list_response)
    end

    it "returns a list of calendars" do
      result = service.list_calendars

      expect(result).to be_an(Array)
      expect(result.length).to eq(2)
      expect(result.first).to include(
        id: "primary",
        summary: "My Calendar",
        primary: true,
        access_role: "owner"
      )
    end

    context "when token needs refresh" do
      let(:credential) { create(:google_calendar_credential, :expiring_soon, user: user) }
      let(:refresh_response) do
        {
          access_token: "new_access_token",
          expires_at: 1.hour.from_now,
          refresh_token: nil
        }
      end

      before do
        allow(GoogleOAuthService).to receive(:refresh_access_token).and_return(refresh_response)
      end

      it "refreshes the token before making the API call" do
        service.list_calendars

        expect(GoogleOAuthService).to have_received(:refresh_access_token)
          .with(refresh_token: credential.refresh_token)
      end

      it "updates the credential with the new token" do
        service.list_calendars

        credential.reload
        expect(credential.access_token).to eq("new_access_token")
      end
    end

    context "when API returns authorization error" do
      before do
        allow(mock_api_client).to receive(:list_calendar_lists)
          .and_raise(Google::Apis::AuthorizationError.new("Invalid credentials"))
      end

      it "raises AuthenticationError" do
        expect do
          service.list_calendars
        end.to raise_error(GoogleCalendarService::AuthenticationError)
      end

      it "marks the credential as error" do
        service.list_calendars
      rescue GoogleCalendarService::AuthenticationError
        expect(credential.reload.sync_status).to eq("error")
      end
    end

    context "when API returns rate limit error" do
      before do
        allow(mock_api_client).to receive(:list_calendar_lists)
          .and_raise(Google::Apis::RateLimitError.new("Quota exceeded"))
      end

      it "raises QuotaExceededError" do
        expect do
          service.list_calendars
        end.to raise_error(GoogleCalendarService::QuotaExceededError)
      end
    end
  end

  describe "#create_event" do
    let(:service) { described_class.new(user, credential: credential) }
    let(:mock_api_client) { instance_double(Google::Apis::CalendarV3::CalendarService) }
    let(:event_data) do
      {
        summary: "Test Event",
        description: "Test Description",
        start: { date: "2026-01-25" },
        end: { date: "2026-01-25" }
      }
    end
    let(:created_event) do
      double("Event",
             id: "event_123",
             etag: '"abc123"',
             html_link: "https://calendar.google.com/event/123")
    end

    before do
      allow(Google::Apis::CalendarV3::CalendarService).to receive(:new).and_return(mock_api_client)
      allow(mock_api_client).to receive(:authorization=)
      allow(mock_api_client).to receive(:insert_event).and_return(created_event)
    end

    it "creates an event and returns the result" do
      result = service.create_event(calendar_id: "primary", event_data: event_data)

      expect(result).to include(
        id: "event_123",
        etag: '"abc123"',
        html_link: "https://calendar.google.com/event/123"
      )
    end

    it "builds the event with correct data" do
      service.create_event(calendar_id: "primary", event_data: event_data)

      expect(mock_api_client).to have_received(:insert_event) do |calendar_id, event|
        expect(calendar_id).to eq("primary")
        expect(event.summary).to eq("Test Event")
        expect(event.description).to eq("Test Description")
      end
    end
  end

  describe "#update_event" do
    let(:service) { described_class.new(user, credential: credential) }
    let(:mock_api_client) { instance_double(Google::Apis::CalendarV3::CalendarService) }
    let(:event_data) do
      {
        summary: "Updated Event",
        description: "Updated Description",
        start: { date: "2026-01-25" },
        end: { date: "2026-01-25" }
      }
    end
    let(:updated_event) do
      double("Event",
             id: "event_123",
             etag: '"new_etag"',
             html_link: "https://calendar.google.com/event/123")
    end

    before do
      allow(Google::Apis::CalendarV3::CalendarService).to receive(:new).and_return(mock_api_client)
      allow(mock_api_client).to receive(:authorization=)
      allow(mock_api_client).to receive(:update_event).and_return(updated_event)
    end

    it "updates an event and returns the result" do
      result = service.update_event(calendar_id: "primary", event_id: "event_123", event_data: event_data)

      expect(result).to include(
        id: "event_123",
        etag: '"new_etag"'
      )
    end

    it "uses etag for conditional update when provided" do
      expect(mock_api_client).to receive(:update_event) do |calendar_id, event_id, _event, **options|
        expect(calendar_id).to eq("primary")
        expect(event_id).to eq("event_123")
        expect(options[:options]).to be_a(Google::Apis::RequestOptions)
        expect(options[:options].header).to eq({ "If-Match" => '"old_etag"' })
        updated_event
      end

      service.update_event(calendar_id: "primary", event_id: "event_123", event_data: event_data, etag: '"old_etag"')
    end

    context "when event is not found" do
      before do
        error = Google::Apis::ClientError.new("Not Found")
        allow(error).to receive(:status_code).and_return(404)
        allow(mock_api_client).to receive(:update_event).and_raise(error)
      end

      it "raises EventNotFoundError" do
        expect do
          service.update_event(calendar_id: "primary", event_id: "missing", event_data: event_data)
        end.to raise_error(GoogleCalendarService::EventNotFoundError)
      end
    end
  end

  describe "#delete_event" do
    let(:service) { described_class.new(user, credential: credential) }
    let(:mock_api_client) { instance_double(Google::Apis::CalendarV3::CalendarService) }

    before do
      allow(Google::Apis::CalendarV3::CalendarService).to receive(:new).and_return(mock_api_client)
      allow(mock_api_client).to receive(:authorization=)
      allow(mock_api_client).to receive(:delete_event)
    end

    it "deletes the event and returns true" do
      result = service.delete_event(calendar_id: "primary", event_id: "event_123")

      expect(result).to be true
      expect(mock_api_client).to have_received(:delete_event).with("primary", "event_123")
    end

    context "when event is already deleted (404)" do
      before do
        error = Google::Apis::ClientError.new("Not Found")
        allow(error).to receive(:status_code).and_return(404)
        allow(mock_api_client).to receive(:delete_event).and_raise(error)
      end

      it "returns true without raising" do
        result = service.delete_event(calendar_id: "primary", event_id: "missing")

        expect(result).to be true
      end
    end
  end

  describe "#get_event" do
    let(:service) { described_class.new(user, credential: credential) }
    let(:mock_api_client) { instance_double(Google::Apis::CalendarV3::CalendarService) }
    let(:event) do
      double("Event",
             id: "event_123",
             summary: "Test Event",
             description: "Description",
             start: double("Start", date: "2026-01-25"),
             end_: double("End", date: "2026-01-25"),
             etag: '"abc123"')
    end

    before do
      allow(Google::Apis::CalendarV3::CalendarService).to receive(:new).and_return(mock_api_client)
      allow(mock_api_client).to receive(:authorization=)
      allow(mock_api_client).to receive(:get_event).and_return(event)
    end

    it "returns the event data" do
      result = service.get_event(calendar_id: "primary", event_id: "event_123")

      expect(result).to include(
        id: "event_123",
        summary: "Test Event",
        etag: '"abc123"'
      )
    end

    context "when event is not found" do
      before do
        error = Google::Apis::ClientError.new("Not Found")
        allow(error).to receive(:status_code).and_return(404)
        allow(mock_api_client).to receive(:get_event).and_raise(error)
      end

      it "raises EventNotFoundError" do
        expect do
          service.get_event(calendar_id: "primary", event_id: "missing")
        end.to raise_error(GoogleCalendarService::EventNotFoundError)
      end
    end
  end

  describe "#list_calendars_with_credential" do
    let(:credential) { create(:google_calendar_credential, user: user) }
    let(:service) { described_class.new(user, credential: credential) }
    let(:temp_credential) do
      double("TempCredential",
             access_token: "temp_access",
             refresh_token: "temp_refresh",
             token_expires_at: 1.hour.from_now)
    end
    let(:mock_api_client) { instance_double(Google::Apis::CalendarV3::CalendarService) }
    let(:calendar_list_response) do
      double("CalendarList", items: [
               double("Calendar",
                      id: "primary",
                      summary: "My Calendar",
                      description: nil,
                      primary: true,
                      access_role: "owner")
             ])
    end

    before do
      allow(Google::Apis::CalendarV3::CalendarService).to receive(:new).and_return(mock_api_client)
      allow(mock_api_client).to receive(:authorization=)
      allow(mock_api_client).to receive(:list_calendar_lists).and_return(calendar_list_response)
    end

    it "lists calendars using the temporary credential" do
      result = service.list_calendars_with_credential(temp_credential)

      expect(result).to be_an(Array)
      expect(result.first[:id]).to eq("primary")
    end
  end
end
